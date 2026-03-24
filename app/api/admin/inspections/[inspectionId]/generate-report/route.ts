import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateReportHTML } from "@/lib/report-template";
import { uploadBuffer, getFileUrl } from "@/lib/s3";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "OWNER" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { inspectionId } = await params;

    // Fetch complete inspection data
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        job: true,
        technician: {
          select: { name: true, email: true },
        },
        clientSignature: true,
        generatedReport: true,
      },
    });

    if (!inspection) {
      return NextResponse.json({ success: false, error: "Inspection not found" }, { status: 404 });
    }

    // Generate HTML for client version
    const clientHTML = generateReportHTML(inspection as Parameters<typeof generateReportHTML>[0], true);

    // Step 1: Create the PDF generation request
    const createResponse = await fetch("https://apps.abacus.ai/api/createConvertHtmlToPdfRequest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: clientHTML,
        pdf_options: {
          format: "A4",
          margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
          print_background: true,
        },
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json().catch(() => ({ error: "Failed to create PDF request" }));
      console.error("PDF creation error:", error);
      return NextResponse.json({ success: false, error: "Failed to generate PDF" }, { status: 500 });
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      return NextResponse.json({ success: false, error: "No request ID returned" }, { status: 500 });
    }

    // Step 2: Poll for status until completion
    const maxAttempts = 120; // 2 minutes max
    let attempts = 0;
    let pdfBuffer: Buffer | null = null;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await fetch("https://apps.abacus.ai/api/getConvertHtmlToPdfStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request_id: request_id,
          deployment_token: process.env.ABACUSAI_API_KEY,
        }),
      });

      const statusResult = await statusResponse.json();
      const status = statusResult?.status || "FAILED";
      const result = statusResult?.result || null;

      if (status === "SUCCESS") {
        if (result && result.result) {
          pdfBuffer = Buffer.from(result.result, "base64");
          break;
        } else {
          return NextResponse.json(
            { success: false, error: "PDF generation completed but no result data" },
            { status: 500 }
          );
        }
      } else if (status === "FAILED") {
        const errorMsg = result?.error || "PDF generation failed";
        console.error("PDF generation failed:", errorMsg);
        return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
      }

      attempts++;
    }

    if (!pdfBuffer) {
      return NextResponse.json({ success: false, error: "PDF generation timed out" }, { status: 500 });
    }

    // Step 3: Upload PDF to S3
    const fileName = `inspection-report-${inspection.inspectionNumber}.pdf`;
    const cloudPath = await uploadBuffer(pdfBuffer, fileName, "application/pdf", false);

    // Step 4: Save report record in database
    await prisma.generatedReport.upsert({
      where: { inspectionId },
      create: {
        inspectionId,
        clientReportCloudPath: cloudPath,
      },
      update: {
        clientReportCloudPath: cloudPath,
        updatedAt: new Date(),
      },
    });

    // Get the URL for confirmation
    const reportUrl = await getFileUrl(cloudPath, false);

    return NextResponse.json({
      success: true,
      message: "Report generated successfully",
      cloudPath,
      reportUrl,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ success: false, error: "Failed to generate report" }, { status: 500 });
  }
}
