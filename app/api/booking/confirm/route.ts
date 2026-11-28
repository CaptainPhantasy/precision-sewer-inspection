import { NextRequest, NextResponse } from 'next/server';
import { BookingConfirmationError, confirmPaidBooking } from '@/lib/booking-confirmation';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    return NextResponse.json(await confirmPaidBooking(sessionId));
  } catch (error) {
    const status = error instanceof BookingConfirmationError ? error.status : 503;
    return NextResponse.json({
      success: false,
      error: error instanceof BookingConfirmationError
        ? error.message
        : 'Booking confirmation is temporarily unavailable. Please try again.',
    }, { status });
  }
}
