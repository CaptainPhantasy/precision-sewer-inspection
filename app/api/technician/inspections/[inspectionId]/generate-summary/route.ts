import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { aiService } from "@/lib/services/ai.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["TECHNICIAN", "ADMIN", "SUPER_ADMIN"])) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { inspectionId } = await params;
    const { type } = await request.json(); // "findings" | "recommendations" | "full"

    // Fetch inspection data
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        job: true,
        technician: { select: { name: true } },
      },
    });

    if (!inspection) {
      return NextResponse.json({ success: false, error: "Inspection not found" }, { status: 404 });
    }

    // Build context from inspection data
    const rootIntrusion = inspection.rootIntrusion as { severity?: string; location?: string; notes?: string } | null;
    const cracks = inspection.cracks as { location: string; severity: string; type?: string }[] | null;
    const bellies = inspection.bellies as { location: string; severity: string }[] | null;
    const offsetJoints = inspection.offsetJoints as { location: string; severity: string }[] | null;
    const blockages = inspection.blockages as { location: string; type?: string; severity: string }[] | null;

    const context = {
      propertyAddress: `${inspection.job.propertyAddress}, ${inspection.job.propertyCity}, ${inspection.job.propertyState}`,
      clientName: inspection.job.clientName,
      homeAge: inspection.homeAge,
      pipeMaterial: inspection.pipeMaterial,
      knownIssues: inspection.knownIssues,
      backupHistory: inspection.backupHistory,
      overallCondition: inspection.overallCondition,
      pipeConditionRating: inspection.pipeConditionRating,
      rootIntrusion,
      cracks,
      bellies,
      offsetJoints,
      blockages,
      connectionToMain: inspection.connectionToMain,
      recommendations: inspection.recommendations,
      urgencyLevel: inspection.urgencyLevel,
      technicianName: inspection.technician.name,
      inspectionDate: inspection.completedAt?.toISOString(),
    };

    let result;

    switch (type) {
      case "findings":
        result = await aiService.generateFindingsSummary(context);
        break;
      case "recommendations":
        result = await aiService.generateRecommendations(context);
        break;
      case "full":
      default:
        result = await aiService.generateFullSummary(context);
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to generate summary" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      summary: result.content,
      type,
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
