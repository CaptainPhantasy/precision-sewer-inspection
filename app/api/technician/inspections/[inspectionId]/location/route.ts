import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LocationEventType } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["TECHNICIAN", "ADMIN", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { inspectionId } = await params;
    const { latitude, longitude, accuracy, eventType, isOverride, overrideReason, overridePhotoUrl } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
    });

    if (!inspection) {
      return NextResponse.json(
        { success: false, error: "Inspection not found" },
        { status: 404 }
      );
    }

    if (user.role === "TECHNICIAN" && inspection.technicianId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const locationLog = await prisma.locationLog.create({
      data: {
        inspectionId,
        latitude,
        longitude,
        accuracy,
        eventType: eventType as LocationEventType || "ARRIVED",
        isOverride: isOverride || false,
        overrideReason,
        overridePhotoUrl,
      },
    });

    return NextResponse.json({
      success: true,
      locationLog,
    });
  } catch (error) {
    console.error("Error logging location:", error);
    return NextResponse.json(
      { success: false, error: "Failed to log location" },
      { status: 500 }
    );
  }
}
