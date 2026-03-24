import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';
import { AppError, ErrorCode, errorResponse } from '@/lib/errors';
import { sendAdminNotification, sendNotificationEmail, getPaymentReceivedEmail, getPaymentReceiptEmail } from '@/lib/notifications';

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new AppError(
        ErrorCode.SERVICE_UNAVAILABLE,
        'STRIPE_WEBHOOK_SECRET is required in this environment',
        503
      );
    }

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errorMessage);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    return errorResponse(error);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const customerEmail = session.customer_email || session.customer_details?.email;
  const amountTotal = session.amount_total ? session.amount_total / 100 : 0;
  const customerName = metadata.customerName || 'Online Booking';

  console.log('Checkout completed:', {
    sessionId: session.id,
    customerEmail,
    amount: amountTotal,
    metadata,
  });

  // Update the pre-saved contact submission with payment info, or create one if it doesn't exist
  try {
    const submissionId = metadata.submissionId;
    if (submissionId) {
      // Update the existing record that was saved before Stripe redirect
      await prisma.contactSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'paid',
          stripeSessionId: session.id,
          amountPaid: amountTotal,
          paidAt: new Date(),
        },
      });
      console.log('Contact submission updated with payment info:', submissionId);
    } else {
      // Fallback: create a new record if pre-save didn't happen
      await prisma.contactSubmission.create({
        data: {
          name: customerName,
          email: customerEmail || '',
          phone: metadata.customerPhone || '',
          serviceType: metadata.serviceType || 'paid-booking',
          source: 'stripe-booking',
          message: metadata.message || '',
          status: 'paid',
          propertyAddress: metadata.propertyAddress || null,
          stripeSessionId: session.id,
          amountPaid: amountTotal,
          paidAt: new Date(),
          appointmentDate: metadata.appointmentDate || null,
          appointmentTime: metadata.appointmentDisplay || null,
          promoCode: metadata.promoCode || null,
        },
      });
      console.log('Contact submission created for paid booking (no pre-save found)');
    }
  } catch (error) {
    console.error('Error updating/creating contact submission:', error);
  }

  // Fetch the full submission record to get structured fields for admin email
  let submission: { occupancy?: string | null; cleanoutLocation?: string | null; buyersAgent?: string | null; listingAgent?: string | null; howHeardAboutUs?: string | null; directions?: string | null } | null = null;
  if (metadata.submissionId) {
    try {
      submission = await prisma.contactSubmission.findUnique({
        where: { id: metadata.submissionId },
        select: { occupancy: true, cleanoutLocation: true, buyersAgent: true, listingAgent: true, howHeardAboutUs: true, directions: true },
      });
    } catch (e) {
      console.error('Error fetching submission for email enrichment:', e);
    }
  }

  // Send payment received notification to admins (Ryan & Douglas)
  try {
    const adminEmail = getPaymentReceivedEmail({
      customerName,
      customerEmail: customerEmail || 'N/A',
      customerPhone: metadata.customerPhone || undefined,
      amount: amountTotal,
      propertyAddress: metadata.propertyAddress || 'Not provided',
      accessMethod: metadata.accessMethod || metadata.sewerAccessMethod || 'Not specified',
      promoCode: metadata.promoCode || undefined,
      stripeSessionId: session.id,
      appointmentDisplay: metadata.appointmentDisplay || undefined,
      occupancy: submission?.occupancy || undefined,
      cleanoutLocation: submission?.cleanoutLocation || undefined,
      buyersAgent: submission?.buyersAgent || undefined,
      listingAgent: submission?.listingAgent || undefined,
      howHeardAboutUs: submission?.howHeardAboutUs || undefined,
      directions: submission?.directions || undefined,
    });
    await sendAdminNotification(
      process.env.NOTIF_ID_PAYMENT_RECEIVED || '',
      {
        subject: adminEmail.subject,
        htmlContent: adminEmail.htmlContent,
      }
    );
  } catch (error) {
    console.error('Error sending payment received admin notification:', error);
  }

  // Send payment receipt to the customer
  if (customerEmail) {
    try {
      const discountAmount = session.total_details?.amount_discount
        ? session.total_details.amount_discount / 100
        : 0;
      const receiptEmail = getPaymentReceiptEmail({
        customerName,
        amount: amountTotal,
        propertyAddress: metadata.propertyAddress || 'Not provided',
        accessMethod: metadata.accessMethod || metadata.sewerAccessMethod || 'Not specified',
        appointmentDisplay: metadata.appointmentDisplay || undefined,
        promoCode: metadata.promoCode || undefined,
        discountAmount: discountAmount || undefined,
      });
      await sendNotificationEmail(
        process.env.NOTIF_ID_PAYMENT_RECEIPT || '',
        {
          recipientEmail: customerEmail,
          recipientName: customerName,
          subject: receiptEmail.subject,
          htmlContent: receiptEmail.htmlContent,
        }
      );
    } catch (error) {
      console.error('Error sending payment receipt to customer:', error);
    }
  }
}
