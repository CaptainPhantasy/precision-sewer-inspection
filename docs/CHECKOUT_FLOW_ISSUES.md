# PSI Checkout Flow Issues & Fixes Tracker
## Status: IN PROGRESS - 2026-05-27

---

## ISSUE 1: Missing Extra Charges Guidance (Toilet Pull/Wax Ring)
**Problem**: Customers selecting "standard" sewer inspection aren't being informed about potential extra charges if cleanout is unavailable on-site.

**Root Cause**: The contact form defaults to `sewer-inspection` ($159) and doesn't explain that alternative access methods (toilet pull +$65, roof vent +$50, crawlspace +$30) may be needed.

**Files Affected**: 
- `app/contact/contact-form.tsx` - service type selection (lines 32-36)
- Need: Alert/warning when standard cleanout access is uncertain

**Fix Required**: Add guidance for customers to select appropriate service type or add warning about potential extra charges.

---

## ISSUE 2: 10% Discount Implementation Flaws
**Problem**: 10% discount not working correctly. The promo code gives $10 off (fixed) not 10% off, and may not be calculating correctly.

**Root Cause**: 
- `components/promo-banner.tsx` line 10: `DISCOUNT_AMOUNT = 10` is a FIXED $10 amount, not 10%
- `lib/stripe.ts` line 5: `PROMO_DISCOUNT_AMOUNT = 1000` = $10 in cents

**Files Affected**: 
- `components/promo-banner.tsx`
- `app/api/stripe/checkout/route.ts`
- `.env.example` - may need promo configuration

**Fix Required**: Clarify discount type (fixed vs percentage) and ensure it applies correctly to all service types.

---

## ISSUE 3: Cannot Go Back and Edit Services
**Problem**: Review step allows editing individual sections (job-details, client-details, datetime) but the service type selection is in step 1 and has no way to change the actual service type in review.

**Root Cause**: The "Order Details" edit button on review (line 683) goes to 'job-details' but doesn't expose service type change - it's locked in the display banner.

**Files Affected**: 
- `app/contact/contact-form.tsx` lines 386-389 (service type banner)
- Need: Service type change capability on review step

**Fix Required**: Allow service type to be changed from review step OR make service type clickable in step 1.

---

## ISSUE 4: Cannot Purchase Needed Add-ons
**Problem**: The checkout flow has no mechanism to add add-ons (toilet pull, same-day, etc.) after initial service selection. `addOns: []` is hardcoded in handleCheckout.

**Root Cause**: 
- `app/contact/contact-form.tsx` line 257: `addOns: []` - always empty
- No UI to select add-ons in any step

**Files Affected**: 
- `app/contact/contact-form.tsx` - needs add-on selection UI
- `app/api/stripe/checkout/route.ts` - addOns logic exists but UI doesn't

**Fix Required**: Add add-on selection UI (toilet pull, same-day, etc.) with proper pricing display.

---

## ISSUE 5: Service Type Pricing Inconsistency
**Problem**: The predefined service types show flat pricing but don't reflect the actual pricing logic in the Stripe API.

**Current**: 
- `sewer-inspection` = $159
- `sewer-inspection-toilet` = $224 (but toilet pull in Stripe is $65, so 159+65=224 - CORRECT)
- `sewer-inspection-roof` = $209 (but roof vent in Stripe is $50, so 159+50=209 - CORRECT)

Actually these look correct. Let me verify the Stripe checkout route logic...

---

## VERIFICATION CHECKLIST
- [ ] Check if service types map correctly to Stripe line items
- [ ] Verify promo discount calculation
- [ ] Test add-on functionality
- [ ] Confirm service type change capability
- [ ] Verify all UI elements for extra charges

---

## ACTIONS LOG

### 2026-05-27 - Investigation Phase
1. Found contact-form.tsx is the main checkout component
2. Found promo-banner.tsx handles SAVE10 discount
3. Found app/api/stripe/checkout/route.ts handles payment processing
4. Found lib/stripe.ts defines product pricing

### Identified Issues:
1. Extra charges guidance missing - no warning about potential access method costs
2. 10% discount confusion - it's actually $10 off, not 10%
3. Service type change blocked - no way to change service type from review
4. Add-ons not selectable - addOns array always empty
5. Need to verify discount application in Stripe checkout

---

## CURRENT STATUS
- [x] Investigation complete
- [ ] Create fix for extra charges guidance
- [ ] Fix service type change capability
- [ ] Add add-on selection UI
- [ ] Verify discount implementation
- [ ] Build verification
- [ ] Git commit with git-steward