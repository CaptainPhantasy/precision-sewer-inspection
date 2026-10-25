import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  bookingSchema, contactFormSchema, overrideRequestSchema, videoChapterSchema,
  postInspectionDataSchema, parseWithZod, passwordSchema,
} from '../lib/validations';

const booking = {
  clientName: 'Synthetic Client', clientEmail: 'client@example.test',
  clientPhone: '3175550100', propertyAddress: '100 Synthetic Test Lane',
  propertyZip: '46201', scheduledDate: '2026-11-01',
};
const parsed = bookingSchema.parse(booking);
assert.equal(parsed.clientRole, 'HOMEOWNER');
assert.equal(parsed.propertyCity, 'Indianapolis');
assert.equal(parsed.propertyState, 'IN');
assert.equal(parsed.accessType, 'CLEANOUT');
assert.equal(parsed.hasCrawlSpace, false);
assert.ok(!Object.prototype.hasOwnProperty.call(parsed, 'scheduledTime'));
assert.ok(!Object.prototype.hasOwnProperty.call(parsed, 'specialNotes'));
assert.deepEqual(parseWithZod(bookingSchema, { ...booking, clientPhone: '' }), {
  success: false, error: 'Phone must be 10 digits', field: 'clientPhone',
});
for (const change of [
  { clientEmail: 'invalid' }, { clientRole: 'INVALID' }, { accessType: 'INVALID' },
  { propertyZip: '123' }, { propertyAddress: undefined },
  { clientName: 'X'.repeat(101) }, { scheduledDate: 'invalid-date' },
]) assert.equal(bookingSchema.safeParse({ ...booking, ...change }).success, false);
assert.equal(bookingSchema.safeParse({ ...booking, clientName: 'X'.repeat(100) }).success, true);
assert.equal(contactFormSchema.parse({ name: booking.clientName, email: booking.clientEmail,
  message: 'Synthetic validation request.' }).serviceType, 'general');
assert.equal(overrideRequestSchema.parse({ reason: 'OTHER' }).skipSignature, false);
assert.equal(videoChapterSchema.parse({ timestamp: 0, title: 'Synthetic chapter', chapterType: 'FINDING' }).includeInHighlight, true);
assert.equal(postInspectionDataSchema.safeParse({
  overallCondition: 'GOOD', pipeConditionRating: 5, connectionToMain: 'Connected',
  recommendations: 'Synthetic validation recommendation.', urgencyLevel: 'NONE', cracks: null,
}).success, true);
const generatedPassword = randomUUID().concat('Aa1');
assert.equal(passwordSchema.safeParse(generatedPassword).success, true);
assert.equal(passwordSchema.safeParse('a'.repeat(20)).success, false);
assert.equal(passwordSchema.safeParse('A1a').success, false);
console.log('Validation checks passed: defaults, omitted optional fields, input rejection, error shape and password policy.');
