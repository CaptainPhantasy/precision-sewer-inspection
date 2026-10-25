import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { assertTestDatabase, requireTestUserPassword } from './test-data/guard';
import { jobScenarios, TEST_PREFIX, testId, testUsers } from './test-data/fixtures';

function checkGuards() {
  const fixtureUrl = new URL('postgresql://127.0.0.1:55432/psi_test');
  fixtureUrl.username = 'psi_test';
  fixtureUrl.password = randomUUID();
  const valid = { PSI_TEST_MODE: 'true', DATABASE_URL: fixtureUrl.toString() };
  const changedUrl = (changes: Partial<Pick<URL, 'hostname' | 'port' | 'username' | 'password' | 'pathname'>>) =>
    Object.assign(new URL(valid.DATABASE_URL), changes).toString();
  assert.equal(new URL(assertTestDatabase(valid)).port, '55432');
  assert.doesNotThrow(() => assertTestDatabase({ ...valid, DATABASE_URL: valid.DATABASE_URL.replace('127.0.0.1', 'localhost') }));
  assert.throws(() => assertTestDatabase({ ...valid, PSI_TEST_MODE: undefined }));
  assert.throws(() => assertTestDatabase({ ...valid, PSI_TEST_MODE: 'false' }));
  for (const url of [
    '', 'invalid', changedUrl({ hostname: 'production.example.test' }),
    changedUrl({ port: '5432' }), changedUrl({ username: 'postgres' }),
    changedUrl({ pathname: '/production' }), changedUrl({ password: '' }),
    valid.DATABASE_URL.replace('postgresql:', 'https:'),
    `${valid.DATABASE_URL}?host=production.example.test`, `${valid.DATABASE_URL}?schema=production`,
    `${valid.DATABASE_URL}#production`,
  ]) assert.throws(() => assertTestDatabase({ ...valid, DATABASE_URL: url }));
  assert.throws(() => requireTestUserPassword({}));
  assert.throws(() => requireTestUserPassword({ PSI_TEST_USER_PASSWORD: 'too-short' }));
  assert.throws(() => requireTestUserPassword({ PSI_TEST_USER_PASSWORD: 'a'.repeat(73) }));
  assert.throws(() => requireTestUserPassword({ PSI_TEST_USER_PASSWORD: '🔑'.repeat(20) }));
  assert.doesNotThrow(() => requireTestUserPassword({ PSI_TEST_USER_PASSWORD: randomUUID() }));
  console.log('Test database and password guards: PASS (no database connection required).');
}

async function main() {
  checkGuards();
  if (process.argv.includes('--guard-only')) return;

  const databaseUrl = assertTestDatabase();
  const password = requireTestUserPassword();
  const { createPrismaClient } = await import('../lib/prisma-client');
  const { default: bcrypt } = await import('bcryptjs');
  const { postInspectionDataSchema } = await import('../lib/validations');
  const { serviceAreas, serviceOfferings } = await import('../prisma/seed-service-areas');
  const { faqs } = await import('../prisma/seed-faqs');
  const prisma = createPrismaClient(databaseUrl);
  const where = { id: { startsWith: TEST_PREFIX } };
  try {
    const counts = {
      users: await prisma.user.count({ where }), jobs: await prisma.job.count({ where }),
      inspections: await prisma.inspection.count({ where }), faqs: await prisma.fAQ.count({ where }),
      profiles: await prisma.technicianProfile.count({ where }), territories: await prisma.technicianServiceArea.count({ where }),
      videos: await prisma.videoAttachment.count({ where }), voices: await prisma.voiceRecording.count({ where }),
      reports: await prisma.generatedReport.count({ where }), trackingTokens: await prisma.clientTrackingToken.count({ where }),
      leads: await prisma.leadCapture.count({ where }), contacts: await prisma.contactSubmission.count({ where }),
      conversations: await prisma.conversation.count({ where }), participants: await prisma.conversationParticipant.count({ where }),
      messages: await prisma.message.count({ where }),
    };
    assert.deepEqual(counts, {
      users: 6, jobs: 16, inspections: 12, faqs: faqs.length, profiles: 2, territories: 3,
      videos: 2, voices: 1, reports: 2, trackingTokens: 2, leads: 3, contacts: 2,
      conversations: 1, participants: 2, messages: 3,
    }, 'Fixture counts must remain identical after repeated seeds.');

    const users = await prisma.user.findMany({ where });
    assert.equal(new Set(users.filter((user) => user.isActive).map((user) => user.role)).size, 5);
    assert.equal(users.filter((user) => !user.isActive).length, 1);
    for (const expected of testUsers) {
      const user = users.find((record) => record.id === testId(`user-${expected.key}`));
      assert.ok(user, 'Each role fixture must exist.');
      assert.equal(user.email, `${expected.key}@example.test`);
      assert.equal(user.role, expected.role);
      assert.equal(user.isActive, expected.isActive);
      assert.ok(await bcrypt.compare(password, user.passwordHash), 'Test login must use the supplied password.');
    }

    const jobs = await prisma.job.findMany({ where, include: { inspection: true, technician: true } });
    assert.equal(new Set(jobs.map((job) => job.status)).size, 8, 'All job states need examples.');
    assert.equal(new Set(jobs.map((job) => job.accessType)).size, 4, 'All access methods need examples.');
    assert.equal(new Set(jobs.map((job) => job.clientRole)).size, 6, 'All customer roles need examples.');
    const accessFees = { CLEANOUT: 0, ROOF_VENT: 50, TOILET_PULL: 65, UNKNOWN: 0 };
    for (const scenario of jobScenarios) {
      const job = jobs.find((record) => record.id === testId(`job-${scenario.key}`));
      assert.ok(job);
      assert.equal(job.status, scenario.status);
      assert.equal(job.accessType, scenario.accessType);
      assert.equal(job.hasCrawlSpace, Boolean(scenario.hasCrawlSpace));
      assert.equal(job.basePrice, 159, 'Current checkout baseline is $159.');
      assert.equal(job.accessFee, accessFees[job.accessType] + (job.hasCrawlSpace ? 30 : 0));
      assert.equal(job.totalPrice, job.basePrice + job.accessFee);
      assert.match(job.clientEmail, /@example\.test$/);
      assert.match(job.propertyAddress, /Synthetic.*fictional/);
      assert.equal(job.clientPhone, null);
      assert.equal(job.propertyLat, null);
      assert.equal(job.propertyLng, null);
      if (scenario.stage) {
        assert.ok(job.inspection);
        assert.equal(job.inspection.jobId, job.id);
        assert.equal(job.inspection.technicianId, testId('user-technician'));
        assert.equal(job.inspection.currentStage, scenario.stage);
        assert.equal(job.inspection.status, scenario.inspectionStatus);
      } else assert.equal(job.inspection, null);
      if (job.technician) assert.equal(job.technician.isActive, true);
    }
    const inspections = jobs.flatMap((job) => job.inspection ? [job.inspection] : []);
    assert.equal(new Set(inspections.map((inspection) => inspection.status)).size, 6, 'All review states need examples.');
    for (const inspection of inspections.filter((record) => record.overallCondition !== null)) {
      assert.ok(postInspectionDataSchema.safeParse(inspection).success, 'Synthetic findings must pass the same form validation as real inspection input.');
    }
    const rejected = inspections.find((inspection) => inspection.status === 'REJECTED');
    assert.equal(rejected?.reviewedBy, testId('user-manager'));
    assert.equal(rejected?.rejectedStage, 'POST_INSPECTION');

    const areas = await prisma.serviceArea.findMany({ where: { slug: { in: serviceAreas.map((area) => area.slug) } } });
    const services = await prisma.serviceOffering.findMany({ where: { slug: { in: serviceOfferings.map((service) => service.slug) } } });
    assert.equal(areas.length, serviceAreas.length);
    assert.equal(services.length, serviceOfferings.length);
    const links = await prisma.serviceAreaPricing.count({ where: { serviceAreaId: { in: areas.map((area) => area.id) }, serviceId: { in: services.map((service) => service.id) } } });
    assert.equal(links, serviceAreas.length * serviceOfferings.length);
    assert.equal(services.find((service) => service.slug === 'emergency-sewer-service')?.isActive, false, 'Preserve the repository emergency-service quarantine.');
    for (const source of serviceOfferings) assert.equal(services.find((service) => service.slug === source.slug)?.basePrice, source.basePrice);
    const storedFaqs = await prisma.fAQ.findMany({ where });
    assert.equal(new Set(storedFaqs.map((faq) => faq.question)).size, faqs.length, 'Reruns must not duplicate FAQ questions.');
    for (const source of faqs) assert.equal(storedFaqs.find((faq) => faq.question === source.question)?.answer, source.answer);
    const profiles = await prisma.technicianProfile.findMany({ where, include: { serviceAreas: true, user: true } });
    assert.equal(profiles.find((profile) => profile.user.isActive)?.serviceAreas.length, 2);
    assert.equal(profiles.find((profile) => !profile.user.isActive)?.isPublic, false);
    for (const profile of profiles) assert.equal(profile.serviceAreas.filter((area) => area.isPrimary).length, 1);

    const videos = await prisma.videoAttachment.findMany({ where });
    assert.deepEqual(videos.map((video) => video.uploadStatus).sort(), ['FAILED', 'PENDING']);
    for (const video of videos) {
      assert.equal(video.cloudPath, '');
      assert.equal(video.publicUrl, null);
      assert.equal(video.uploadedAt, null);
      assert.equal(video.uploadProgress, 0);
      assert.equal(video.highlightReelUrl, null);
      assert.match(video.fileName, /^SYNTHETIC-NOT-UPLOADED-/);
    }
    for (const report of await prisma.generatedReport.findMany({ where })) {
      assert.equal(report.adminReportUrl, null);
      assert.equal(report.clientReportUrl, null);
      assert.equal(report.adminReportCloudPath, null);
      assert.equal(report.clientReportCloudPath, null);
      assert.match(report.plainLanguageSummary ?? '', /SYNTHETIC TEST SUMMARY/);
    }
    const voice = await prisma.voiceRecording.findUniqueOrThrow({ where: { id: testId('voice-pending') } });
    assert.equal(voice.audioFileUrl, null);
    assert.equal(voice.audioCloudPath, null);
    assert.equal(voice.isProcessed, false);
    const leads = await prisma.leadCapture.findMany({ where });
    assert.equal(leads.filter((lead) => lead.converted).length, 1);
    assert.equal(leads.filter((lead) => !lead.notificationSent).length, 1);
    for (const lead of leads) assert.match(lead.email ?? '', /@example\.test$/);
    for (const contact of await prisma.contactSubmission.findMany({ where })) {
      assert.match(contact.email, /@example\.test$/);
      assert.equal(contact.stripeSessionId, null);
      assert.equal(contact.amountPaid, null);
    }
    const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: testId('conversation-dispatch') }, include: { messages: true, participants: true } });
    assert.equal(conversation.messages.length, 3);
    assert.equal(conversation.messages.filter((message) => !message.isRead).length, 1);
    for (const message of conversation.messages) assert.ok(conversation.participants.some((participant) => participant.userId === message.senderId));
    for (const token of await prisma.clientTrackingToken.findMany({ where })) {
      assert.equal(token.smsOptIn, false);
      assert.match(token.clientEmail, /@example\.test$/);
      assert.ok(jobs.some((job) => job.id === token.jobId));
    }
    // The adapter must keep interactive transactions atomic. This only touches
    // one guarded local fixture and deliberately rolls the change back.
    const contactBefore = await prisma.contactSubmission.findFirstOrThrow({ where });
    const rollbackSignal = new Error('Intentional local transaction rollback');
    await assert.rejects(prisma.$transaction(async (tx) => {
      const changed = await tx.contactSubmission.update({
        where: { id: contactBefore.id },
        data: { message: 'Synthetic rollback verification' },
      });
      assert.equal(changed.message, 'Synthetic rollback verification');
      throw rollbackSignal;
    }), (error: unknown) => error === rollbackSignal);
    const contactAfter = await prisma.contactSubmission.findUniqueOrThrow({ where: { id: contactBefore.id } });
    assert.deepEqual(contactAfter, contactBefore, 'A failed transaction must restore every field.');

    console.log(`Test seed verification: PASS ${JSON.stringify({ ...counts, areas: areas.length, services: services.length, areaServiceLinks: links })}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error && !error.name.startsWith('Prisma') ? error.message : 'Database verification failed; check the dedicated local PostgreSQL service and schema.';
  console.error(`Test seed verification failed: ${message}`);
  process.exitCode = 1;
});
