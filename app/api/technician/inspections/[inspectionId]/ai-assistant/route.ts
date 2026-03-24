import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { aiService } from "@/lib/services/ai.service";
import { inspectionService } from "@/lib/services/inspection.service";

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
    const body = await request.json();
    const { message, conversationHistory } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Get inspection context
    const inspection = await inspectionService.getById(inspectionId, user.id);

    // Build context from inspection data
    const context: Record<string, unknown> = {
      propertyAddress: inspection.job.propertyAddress,
      clientName: inspection.job.clientName,
      homeAge: inspection.homeAge,
      pipeMaterial: inspection.pipeMaterial,
      knownIssues: inspection.knownIssues,
      backupHistory: inspection.backupHistory,
      overallCondition: inspection.overallCondition,
      pipeConditionRating: inspection.pipeConditionRating,
      rootIntrusion: inspection.rootIntrusion,
      cracks: inspection.cracks,
      bellies: inspection.bellies,
      offsetJoints: inspection.offsetJoints,
      blockages: inspection.blockages,
      connectionToMain: inspection.connectionToMain,
      recommendations: inspection.recommendations,
      urgencyLevel: inspection.urgencyLevel,
      technicianName: inspection.technician.name,
      inspectionDuration: inspection.inspectionDuration,
    };

    // Get AI response
    const response = await aiService.chat(
      message,
      context,
      inspection.currentStage,
      conversationHistory || []
    );

    return NextResponse.json({
      success: true,
      response: response.content,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
