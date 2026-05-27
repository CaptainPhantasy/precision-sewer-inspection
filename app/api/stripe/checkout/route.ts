import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRODUCTS } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { ADD_ON_OPTIONS, AddOnId, PROMO_CODE, PROMO_PERCENT, STRIPE_PROMO_COUPON_ID, calculateCheckoutPricing, getAccessMethodForServiceType, getServiceTypeForAccessMethod, normalizeAddOns, isPromoCodeValid } from '@/lib/checkout-pricing';

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

    const effectiveServiceType = serviceType || getServiceTypeForAccessMethod(accessMethod);
    const effectiveAccessMethod = getAccessMethodForServiceType(effectiveServiceType);
    const selectedAddOns = normalizeAddOns(addOns);

    // Build line items based on normalized selections.
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
    if (effectiveAccessMethod === 'roof-vent') {
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
    } else if (effectiveAccessMethod === 'toilet-pull') {
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
    const addOnProductById: Record<AddOnId, typeof STRIPE_PRODUCTS.SAME_DAY_DELIVERY> = {
      'same-day': STRIPE_PRODUCTS.SAME_DAY_DELIVERY,
      'crawl-space': STRIPE_PRODUCTS.CRAWL_SPACE,
      'cleanout-cap': STRIPE_PRODUCTS.CLEANOUT_CAP,
      'additional-cleanout': STRIPE_PRODUCTS.ADDITIONAL_CLEANOUT,
    };

    for (const addOn of ADD_ON_OPTIONS) {
      if (!selectedAddOns.includes(addOn.id)) continue;
      const product = addOnProductById[addOn.id];
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.amount,
        },
        quantity: 1,
      });
    }

    // Apply promo discount if valid. Validate from the promo code only; never trust
    // client-supplied discount amounts as proof a discount should apply.
    const hasValidPromo = isPromoCodeValid(promoCode);
    const checkoutPricing = calculateCheckoutPricing(effectiveServiceType, selectedAddOns, promoCode);
    
    // Get origin for redirect URLs
    const origin = request.headers.get('origin') || 'https://precisionsewerinspections.com';
    const stripeCustomerEmail =
      typeof customerEmail === 'string' && customerEmail.trim().length > 0
        ? customerEmail.trim()
        : undefined;

    // Create or get the SAVE10 coupon for 10% off
    let discounts: Array<{ coupon: string }> = [];

    if (hasValidPromo) {
      try {
        // Try to retrieve existing coupon
        await stripe.coupons.retrieve(STRIPE_PROMO_COUPON_ID);
      } catch {
        // Coupon doesn't exist, create it
        await stripe.coupons.create({
          id: STRIPE_PROMO_COUPON_ID,
          name: '10% Off First Inspection',
          percent_off: PROMO_PERCENT,
          duration: 'once',
        });
      }
      discounts = [{ coupon: STRIPE_PROMO_COUPON_ID }];
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
          serviceType: effectiveServiceType,
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
          promoCode: hasValidPromo ? PROMO_CODE : null,
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
        accessMethod: effectiveAccessMethod,
        sewerAccessMethod,
        addOns: selectedAddOns.join(','),
        promoCode: hasValidPromo ? PROMO_CODE : '',
        message: message?.substring(0, 500) || '',
        // Calendar booking info
        appointmentStart: appointmentStart || '',
        appointmentEnd: appointmentEnd || '',
        appointmentDisplay: appointmentDisplay || '',
        appointmentDate: appointmentDate || '',
        serviceType: effectiveServiceType,
        submissionId: submissionId || '',
        subtotalCents: String(checkoutPricing.subtotalCents),
        discountCents: String(checkoutPricing.discountCents),
      },
      payment_intent_data: {
        receipt_email: stripeCustomerEmail,
        metadata: {
          customerName,
          customerPhone,
          propertyAddress,
          promoCode: hasValidPromo ? PROMO_CODE : '',
          addOns: selectedAddOns.join(','),
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
