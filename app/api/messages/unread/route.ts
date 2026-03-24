import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: Get total unread message count
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["TECHNICIAN", "ADMIN", "SUPER_ADMIN"])) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const participants = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
    });

    let totalUnread = 0;
    for (const p of participants) {
      const count = await prisma.message.count({
        where: {
          conversationId: p.conversationId,
          senderId: { not: user.id },
          createdAt: p.lastReadAt ? { gt: p.lastReadAt } : undefined,
        },
      });
      totalUnread += count;
    }

    return NextResponse.json({ success: true, unreadCount: totalUnread });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch unread count" }, { status: 500 });
  }
}
