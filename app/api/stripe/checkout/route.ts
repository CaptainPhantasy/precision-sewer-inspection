import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRODUCTS } from '@/lib/stripe';
import { prisma } from '@/lib/db';

const PROMO_DISCOUNT_AMOUNT = 1000; // $10.00 in cents

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customerEmail,
      customerName,
      customerPhone,
      propertyAddress,
      accessMethod,
      sewerAccessMethod,
      addOns = [],
      message,
      promoCode,
      discountAmount,
      // Calendar booking info
      appointmentStart,
      appointmentEnd,
      appointmentDisplay,
      appointmentDate,
      serviceType,
      // Structured form fields
      occupancy,
      propertyAccess,
      cleanoutLocation,
      referrerName,
      buyersAgent,
      listingAgent,
      howHeardAboutUs,
      directions,
      propertyCity,
      propertyState,
      propertyZip,
    } = body;

    // Build line items based on selections
    const lineItems: Array<{
      price_data: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
      };
      quantity: number;
    }> = [];

    // Base inspection
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: STRIPE_PRODUCTS.STANDARD_INSPECTION.name,
          description: STRIPE_PRODUCTS.STANDARD_INSPECTION.description,
        },
        unit_amount: STRIPE_PRODUCTS.STANDARD_INSPECTION.amount,
      },
      quantity: 1,
    });

    // Add access method fees
    if (accessMethod === 'roof-vent') {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: STRIPE_PRODUCTS.ROOF_VENT_ACCESS.name,
            description: STRIPE_PRODUCTS.ROOF_VENT_ACCESS.description,
          },
          unit_amount: STRIPE_PRODUCTS.ROOF_VENT_ACCESS.amount,
        },
        quantity: 1,
      });
    } else if (accessMethod === 'toilet-pull') {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: STRIPE_PRODUCTS.TOILET_PULL.name,
            description: STRIPE_PRODUCTS.TOILET_PULL.description,
          },
          unit_amount: STRIPE_PRODUCTS.TOILET_PULL.amount,
        },
        quantity: 1,
      });
    }

    // Add-ons
    if (addOns.includes('same-day')) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: STRIPE_PRODUCTS.SAME_DAY_DELIVERY.name,
            description: STRIPE_PRODUCTS.SAME_DAY_DELIVERY.description,
          },
          unit_amount: STRIPE_PRODUCTS.SAME_DAY_DELIVERY.amount,
        },
        quantity: 1,
      });
    }

    if (addOns.includes('crawl-space')) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: STRIPE_PRODUCTS.CRAWL_SPACE.name,
            description: STRIPE_PRODUCTS.CRAWL_SPACE.description,
          },
          unit_amount: STRIPE_PRODUCTS.CRAWL_SPACE.amount,
        },
        quantity: 1,
      });
    }

    // Apply promo discount if valid
    const hasValidPromo = promoCode === 'SAVE10' && discountAmount === 10;
    
    // Get origin for redirect URLs
    const origin = request.headers.get('origin') || 'https://precisionsewerinspections.com';
    const stripeCustomerEmail =
      typeof customerEmail === 'string' && customerEmail.trim().length > 0
        ? customerEmail.trim()
        : undefined;

    // Create or get the SAVE10 coupon for $10 off
    let discounts: Array<{ coupon: string }> = [];
    
    if (hasValidPromo) {
      try {
        // Try to retrieve existing coupon
        await stripe.coupons.retrieve('SAVE10');
      } catch {
        // Coupon doesn't exist, create it
        await stripe.coupons.create({
          id: 'SAVE10',
          name: '$10 Off First Inspection',
          amount_off: PROMO_DISCOUNT_AMOUNT,
          currency: 'usd',
          duration: 'once',
        });
      }
      discounts = [{ coupon: 'SAVE10' }];
    }

    // Save full form data to database BEFORE Stripe redirect
    // This ensures no data is lost even if the customer abandons checkout
    let submissionId = '';
    try {
      const submission = await prisma.contactSubmission.create({
        data: {
          name: customerName || '',
          email: customerEmail || '',
          phone: customerPhone || null,
          serviceType: serviceType || 'sewer-inspection',
          source: 'stripe-booking',
          message: message?.substring(0, 2000) || '',
          status: 'pending-payment',
          propertyAddress: propertyAddress || null,
          propertyCity: propertyCity || null,
          propertyState: propertyState || null,
          propertyZip: propertyZip || null,
          occupancy: occupancy || null,
          propertyAccess: propertyAccess || null,
          cleanoutLocation: cleanoutLocation || null,
          referrerName: referrerName || null,
          buyersAgent: buyersAgent || null,
          listingAgent: listingAgent || null,
          howHeardAboutUs: howHeardAboutUs || null,
          directions: directions || null,
          appointmentDate: appointmentDate || null,
          appointmentTime: appointmentDisplay || null,
          promoCode: hasValidPromo ? 'SAVE10' : null,
        },
      });
      submissionId = submission.id;
    } catch (dbError) {
      console.error('Error pre-saving booking data:', dbError);
      // Continue with checkout even if pre-save fails
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      discounts: discounts.length > 0 ? discounts : undefined,
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/contact`,
      customer_email: stripeCustomerEmail,
      metadata: {
        customerName,
        customerPhone,
        propertyAddress,
        accessMethod,
        sewerAccessMethod,
        promoCode: hasValidPromo ? 'SAVE10' : '',
        message: message?.substring(0, 500) || '',
        // Calendar booking info
        appointmentStart: appointmentStart || '',
        appointmentEnd: appointmentEnd || '',
        appointmentDisplay: appointmentDisplay || '',
        appointmentDate: appointmentDate || '',
        serviceType: serviceType || '',
        submissionId: submissionId || '',
      },
      payment_intent_data: {
        receipt_email: stripeCustomerEmail,
        metadata: {
          customerName,
          customerPhone,
          propertyAddress,
          promoCode: hasValidPromo ? 'SAVE10' : '',
          appointmentStart: appointmentStart || '',
          appointmentDisplay: appointmentDisplay || '',
        },
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
