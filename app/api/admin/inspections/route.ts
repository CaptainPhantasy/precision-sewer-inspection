import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { badRequestResponse, errorResponse, unauthorizedResponse } from "@/lib/errors";
import { adminService } from "@/lib/services/admin.service";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["ADMIN", "OWNER", "SUPER_ADMIN"])) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (Number.isNaN(page) || page < 1 || Number.isNaN(limit) || limit < 1 || limit > 100) {
      return badRequestResponse("Invalid pagination values");
    }

    const allowedStatuses = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const;
    if (status && !allowedStatuses.includes(status as (typeof allowedStatuses)[number])) {
      return badRequestResponse("Invalid status filter");
    }

    const { inspections, total } = await adminService.getPendingReviewInspections({
      page,
      limit,
      status: status || undefined,
    });

    return NextResponse.json({
      success: true,
      inspections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
