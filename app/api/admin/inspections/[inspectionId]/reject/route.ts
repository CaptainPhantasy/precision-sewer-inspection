import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { badRequestResponse, errorResponse, notFoundResponse, unauthorizedResponse } from "@/lib/errors";
import { sendNotificationEmail, getInspectionReturnedEmail } from "@/lib/notifications";

type RejectableStage =
  | "PRE_INSPECTION"
  | "INSPECTING"
  | "POST_INSPECTION"
  | "VIDEO_ATTACH"
  | "CLIENT_SIGNOFF";

// Valid stages that can be rejected/reopened for technician to redo
const REJECTABLE_STAGES: RejectableStage[] = [
  "PRE_INSPECTION",
  "INSPECTING",
  "POST_INSPECTION",
  "VIDEO_ATTACH",
  "CLIENT_SIGNOFF",
];

const STAGE_LABELS: Record<string, string> = {
  PRE_INSPECTION: "Property Details",
  INSPECTING: "Findings & Defects",
  POST_INSPECTION: "Summary & Recommendations",
  VIDEO_ATTACH: "Video & Chapters",
  CLIENT_SIGNOFF: "Client Signature",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["ADMIN", "OWNER", "SUPER_ADMIN"])) {
      return unauthorizedResponse();
    }

    const { inspectionId } = await params;
    const { reason, rejectedStage } = await request.json();

    if (!reason) {
      return badRequestResponse("Rejection reason is required");
    }

    if (
      !rejectedStage ||
      typeof rejectedStage !== "string" ||
      !REJECTABLE_STAGES.includes(rejectedStage as RejectableStage)
    ) {
      return badRequestResponse("A valid stage must be selected for rejection");
    }

    const selectedStage = rejectedStage as RejectableStage;

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: { job: true, technician: true },
    });

    if (!inspection) {
      return notFoundResponse("Inspection", inspectionId);
    }

    // Update inspection status with the specific rejected stage
    const updatedInspection = await prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        status: "REJECTED",
        currentStage: selectedStage, // Set to the rejected stage so technician can redo it
        rejectedStage: selectedStage, // Track which stage was rejected
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewNotes: reason,
      },
    });

    // Send email to technician with specific stage info
    const stageLabel = STAGE_LABELS[selectedStage] || selectedStage;
    const emailContent = getInspectionReturnedEmail({
      technicianName: inspection.technician.name,
      inspectionNumber: inspection.inspectionNumber,
      propertyAddress: `${inspection.job.propertyAddress}, ${inspection.job.propertyCity}`,
      reason,
      rejectedStage: stageLabel,
    });

    await sendNotificationEmail(
      process.env.NOTIF_ID_INSPECTION_RETURNED_FOR_CORRECTIONS || "",
      {
        recipientEmail: inspection.technician.email,
        recipientName: inspection.technician.name,
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
      }
    );

    return NextResponse.json({
      success: true,
      inspection: updatedInspection,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
