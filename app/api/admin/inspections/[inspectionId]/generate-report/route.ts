import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateReportHTML } from "@/lib/report-template";
import { uploadBuffer, getFileUrl } from "@/lib/s3";
import { pdfService } from "@/lib/services/pdf.service";

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

    // Generate PDF via shared service
    const pdfResult = await pdfService.generatePDF(clientHTML);
    if (!pdfResult.success || !pdfResult.buffer) {
      return NextResponse.json(
        { success: false, error: pdfResult.error || "Failed to generate PDF" },
        { status: 500 }
      );
    }

    // Upload PDF to S3
    const fileName = `inspection-report-${inspection.inspectionNumber}.pdf`;
    const cloudPath = await uploadBuffer(pdfResult.buffer, fileName, "application/pdf", false);

    // Save report record in database
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
