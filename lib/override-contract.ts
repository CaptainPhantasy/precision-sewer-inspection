/** Browser-safe override types and labels; no database imports. */

// Override request reasons
export type OverrideReason =
  | "ACCESS_DENIED"
  | "EQUIPMENT_MALFUNCTION"
  | "PIPE_BLOCKED"
  | "SAFETY_CONCERN"
  | "CLIENT_ABSENT"
  | "PROPERTY_ISSUE"
  | "OTHER";

// Override resolutions
export type OverrideResolution =
  | "COMPLETE" // Accept partial data as complete
  | "PARTIAL" // Mark as partial inspection
  | "INCOMPLETE" // Mark as incomplete (may need refund)
  | "RESCHEDULE"; // Reschedule for another visit

export interface OverrideRequest {
  id: string;
  inspectionId: string;
  inspectionNumber: string;
  technicianId: string;
  technicianName: string;
  reason: OverrideReason;
  notes: string;
  skipSignature: boolean;
  photoUrl: string | null;
  status: "PENDING" | "APPROVED" | "DENIED";
  createdAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  resolution: OverrideResolution | null;
  adminNotes: string | null;
  // Related data
  propertyAddress: string;
  clientName: string;
  clientPhone: string | null;
  currentStage: string;
  completedSteps: string[];
  missingSteps: string[];
}

export interface CreateOverrideInput {
  inspectionId: string;
  technicianId: string;
  reason: OverrideReason;
  notes: string;
  skipSignature?: boolean;
  photoUrl?: string;
}

export interface ReviewOverrideInput {
  resolution: OverrideResolution;
  skipSignature: boolean;
  adminNotes?: string;
}

// Human-readable reason labels
export const OVERRIDE_REASON_LABELS: Record<OverrideReason, string> = {
  ACCESS_DENIED: "Homeowner denied access to area",
  EQUIPMENT_MALFUNCTION: "Equipment malfunction",
  PIPE_BLOCKED: "Pipe completely blocked - cannot proceed",
  SAFETY_CONCERN: "Safety concern at property",
  CLIENT_ABSENT: "Client not present / No access",
  PROPERTY_ISSUE: "Property condition prevents inspection",
  OTHER: "Other (see notes)",
};

// Resolution labels
export const OVERRIDE_RESOLUTION_LABELS: Record<OverrideResolution, string> = {
  COMPLETE: "Mark Complete - Accept partial data",
  PARTIAL: "Mark Partial - Document what was done",
  INCOMPLETE: "Mark Incomplete - May need refund",
  RESCHEDULE: "Reschedule - Return visit needed",
};
