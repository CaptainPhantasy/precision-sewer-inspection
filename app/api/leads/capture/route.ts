export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken, email, name, phone, address, city, state, zip, source, pageUrl } = body;

    if (!sessionToken) {
      return NextResponse.json({ error: "Session token required" }, { status: 400 });
    }

    // Must have at least an email or phone to be contactable
    const hasContactInfo = email || phone;
    if (!hasContactInfo) {
      return NextResponse.json({ error: "Need at least email or phone" }, { status: 400 });
    }

    // Basic email validation if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Build update data - only include fields that have values
    const updateData: Record<string, unknown> = {
      lastActivityAt: new Date(),
    };
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (zip) updateData.zip = zip;
    if (source) updateData.source = source;
    if (pageUrl) updateData.pageUrl = pageUrl;

    // Upsert - create if new session, update if existing
    const lead = await prisma.leadCapture.upsert({
      where: { sessionToken },
      create: {
        sessionToken,
        email: email || null,
        name: name || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        source: source || "website",
        pageUrl: pageUrl || null,
        lastActivityAt: new Date(),
      },
      update: updateData,
    });

    return NextResponse.json({ success: true, id: lead.id });
  } catch (error) {
    console.error("Error capturing lead:", error);
    return NextResponse.json({ error: "Failed to capture lead" }, { status: 500 });
  }
}
