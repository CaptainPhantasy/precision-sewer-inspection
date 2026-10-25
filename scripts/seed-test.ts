import { createHash } from 'node:crypto';
import { assertTestDatabase, requireTestUserPassword } from './test-data/guard';
import { jobPricing, jobScenarios, testId, testUsers } from './test-data/fixtures';

async function main() {
  // All database-backed imports follow this guard, including the public seed modules.
  const databaseUrl = assertTestDatabase();
  const password = requireTestUserPassword();
  const { Prisma } = await import('@prisma/client');
  const { createPrismaClient } = await import('../lib/prisma-client');
  const { default: bcrypt } = await import('bcryptjs');
  const { serviceAreas, serviceOfferings } = await import('../prisma/seed-service-areas');
  const { faqs } = await import('../prisma/seed-faqs');
  const prisma = createPrismaClient(databaseUrl);
  const passwordHash = await bcrypt.hash(password, 12);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const at = (day: number, hour = 10) => new Date(today.getTime() + (day * 24 + hour) * 60 * 60 * 1000);
  const technicianId = testId('user-technician');
  const managerId = testId('user-manager');

  try {
    await prisma.$transaction(async (tx) => {
      const areaIds = new Map<string, string>();
      const serviceIds = new Map<string, string>();
      for (const area of serviceAreas) {
        const record = await tx.serviceArea.upsert({
          where: { slug: area.slug }, update: { ...area, isActive: true },
          create: { id: testId(`area-${area.slug}`), ...area },
        });
        areaIds.set(area.slug, record.id);
      }
      for (const service of serviceOfferings) {
        const record = await tx.serviceOffering.upsert({
          where: { slug: service.slug }, update: service,
          create: { id: testId(`service-${service.slug}`), ...service },
        });
        serviceIds.set(service.slug, record.id);
      }
      for (const [areaSlug, serviceAreaId] of areaIds) {
        for (const [serviceSlug, serviceId] of serviceIds) {
          const data = { serviceAreaId, serviceId, localPrice: null, isAvailable: true, estimatedWaitDays: serviceSlug.includes('emergency') ? 0 : 1 };
          await tx.serviceAreaPricing.upsert({
            where: { serviceAreaId_serviceId: { serviceAreaId, serviceId } }, update: data,
            create: { id: testId(`pricing-${areaSlug}-${serviceSlug}`), ...data },
          });
        }
      }
      for (const faq of faqs) {
        // Question hashes remain stable if the source array is reordered.
        const id = testId(`faq-${createHash('sha256').update(faq.question).digest('hex').slice(0, 24)}`);
        const data = { ...faq, serviceAreas: [], services: [] };
        await tx.fAQ.upsert({ where: { id }, update: data, create: { id, ...data } });
      }
      for (const user of testUsers) {
        const id = testId(`user-${user.key}`);
        const data = {
          email: `${user.key}@example.test`, passwordHash, name: `Synthetic Test ${user.key}`,
          role: user.role, isActive: user.isActive, certifications: [], phone: null,
          bio: 'Synthetic account for local testing only.', profilePhotoPath: null, profilePhotoUrl: null,
        };
        await tx.user.upsert({ where: { id }, update: data, create: { id, ...data } });
      }
      for (const key of ['technician', 'inactive']) {
        const id = testId(`profile-${key}`);
        const userId = testId(`user-${key}`);
        const data = {
          userId, title: 'Synthetic Test Inspector', yearsExperience: 3,
          bio: 'Synthetic profile used to test inspector cards and service territory relationships.',
          shortBio: 'Synthetic test profile.', certifications: [], specializations: ['Test sewer inspections'],
          isPublic: key === 'technician', isFeatured: key === 'technician', sortOrder: key === 'technician' ? 0 : 1,
          photoUrl: null, photoAlt: null, linkedInUrl: null,
        };
        await tx.technicianProfile.upsert({ where: { userId }, update: data, create: { id, ...data } });
      }
      for (const [key, areaSlug, isPrimary] of [
        ['technician', 'indianapolis-in', true], ['technician', 'carmel-in', false], ['inactive', 'fishers-in', true],
      ] as const) {
        const profileId = testId(`profile-${key}`);
        const serviceAreaId = areaIds.get(areaSlug)!;
        const data = { technicianId: profileId, serviceAreaId, isPrimary };
        await tx.technicianServiceArea.upsert({
          where: { technicianId_serviceAreaId: { technicianId: profileId, serviceAreaId } }, update: data,
          create: { id: testId(`territory-${key}-${areaSlug}`), ...data },
        });
      }

      for (const [index, scenario] of jobScenarios.entries()) {
        const id = testId(`job-${scenario.key}`);
        const area = serviceAreas[index % serviceAreas.length];
        const finished = scenario.status === 'COMPLETED';
        const scheduledDay = finished ? -2 : scenario.status === 'PENDING' || scenario.status === 'ASSIGNED' ? 1 : 0;
        const job = {
          jobNumber: `PSI-TEST-${scenario.key}`, clientName: `Synthetic Client ${scenario.key}`,
          clientEmail: `client-${scenario.key}@example.test`, clientPhone: null, clientRole: scenario.clientRole,
          propertyAddress: `${100 + index} Synthetic Test Lane (fictional)`, propertyCity: area.city,
          propertyState: area.state, propertyZip: area.zipCodes[0], propertyLat: null, propertyLng: null,
          scheduledDate: at(scheduledDay, 0), scheduledTime: '10:00 AM', accessType: scenario.accessType,
          hasCrawlSpace: Boolean(scenario.hasCrawlSpace), ...jobPricing(scenario), status: scenario.status,
          technicianId: ['PENDING', 'CANCELLED'].includes(scenario.status) ? null : technicianId,
          specialNotes: `SYNTHETIC TEST DATA. Fictional address; do not dispatch or contact. ${scenario.accessType === 'UNKNOWN' ? 'Access unconfirmed; displayed price is the cleanout baseline only.' : 'Pricing follows the current checkout access and crawl-space fees.'}`,
        };
        await tx.job.upsert({ where: { id }, update: job, create: { id, ...job } });
        if (!scenario.stage || !scenario.inspectionStatus) continue;
        const inspectionId = testId(`inspection-${scenario.key}`);
        const hasFindings = Number(scenario.key) >= 6;
        const reviewed = ['APPROVED', 'REJECTED', 'DELIVERED'].includes(scenario.inspectionStatus);
        const needsRepair = ['11', '13'].includes(scenario.key);
        const inspection = {
          inspectionNumber: `INS-TEST-${scenario.key}`, jobId: id, technicianId,
          currentStage: scenario.stage, status: scenario.inspectionStatus,
          confirmedClientName: job.clientName, confirmedAddress: job.propertyAddress,
          homeAge: 'Synthetic: 30 years', pipeMaterial: 'PVC' as const,
          knownIssues: 'Synthetic inspection scenario; no real property or recorded media.', backupHistory: 'Synthetic: none reported',
          recentWork: 'Synthetic: none', specialInstructions: 'LOCAL TEST ONLY. No customer notifications or external uploads.',
          overallCondition: hasFindings ? needsRepair ? 'NEEDS_ATTENTION' as const : 'GOOD' as const : null,
          rootIntrusion: hasFindings && needsRepair ? { type: 'root_intrusion', severity: 'moderate', location: 'Synthetic: 35 ft', notes: 'Synthetic roots finding for review tests.' } : Prisma.DbNull,
          cracks: Prisma.DbNull, bellies: Prisma.DbNull, offsetJoints: Prisma.DbNull, blockages: Prisma.DbNull,
          pipeConditionRating: hasFindings ? needsRepair ? 3 : 5 : null,
          connectionToMain: hasFindings ? 'Synthetic connection observed at 80 ft.' : null,
          recommendations: hasFindings ? needsRepair ? 'Synthetic recommendation: review the roots finding.' : 'Synthetic recommendation: routine maintenance.' : null,
          urgencyLevel: hasFindings ? needsRepair ? 'SOON' as const : 'NONE' as const : null,
          startedAt: at(scheduledDay, 9), arrivedAt: Number(scenario.key) >= 5 ? at(scheduledDay, 10) : null,
          inspectionStartedAt: hasFindings ? at(scheduledDay, 10) : null,
          inspectionEndedAt: Number(scenario.key) >= 7 ? at(scheduledDay, 11) : null,
          completedAt: finished ? at(scheduledDay, 12) : null, inspectionDuration: finished ? 60 : null,
          reviewedBy: reviewed ? managerId : null, reviewedAt: reviewed ? at(scheduledDay + 1, 9) : null,
          reviewNotes: reviewed ? `Synthetic review: ${scenario.inspectionStatus.toLowerCase()}. No media has been uploaded.` : null,
          rejectedStage: scenario.inspectionStatus === 'REJECTED' ? 'POST_INSPECTION' as const : null,
          extendedMeasurements: hasFindings ? { totalFootage: 80, cameraDirection: 'Toward main', equipmentUsed: 'Synthetic test camera' } : Prisma.DbNull,
        };
        await tx.inspection.upsert({ where: { id: inspectionId }, update: inspection, create: { id: inspectionId, ...inspection } });
      }

      for (const [key, uploadStatus] of [['08', 'PENDING'], ['09', 'FAILED']] as const) {
        const inspectionId = testId(`inspection-${key}`);
        const data = {
          inspectionId, cloudPath: '', publicUrl: null, fileName: `SYNTHETIC-NOT-UPLOADED-${key}.mp4`,
          fileSize: 0, duration: null, mimeType: 'video/mp4', checksum: null, uploadStatus, uploadProgress: 0,
          uploadedAt: null, uploadId: null, highlightDuration: null, highlightReelPath: null, highlightReelUrl: null,
        };
        await tx.videoAttachment.upsert({ where: { inspectionId }, update: data, create: { id: testId(`video-${key}`), ...data } });
      }
      const voice = { inspectionId: testId('inspection-06'), audioFileUrl: null, audioCloudPath: null, transcription: null, section: 'DURING_INSPECTION' as const, duration: null, isProcessed: false, processedAt: null };
      await tx.voiceRecording.upsert({ where: { id: testId('voice-pending') }, update: voice, create: { id: testId('voice-pending'), ...voice } });
      for (const key of ['12', '14']) {
        const inspectionId = testId(`inspection-${key}`);
        const data = {
          inspectionId, plainLanguageSummary: 'SYNTHETIC TEST SUMMARY. This is fixture text, not an AI result. No report PDF or inspection media has been generated or uploaded.',
          estimatedRepairCost: 'Synthetic scenario: not an actual estimate.',
          adminReportCloudPath: null, adminReportUrl: null, clientReportCloudPath: null, clientReportUrl: null,
        };
        await tx.generatedReport.upsert({ where: { inspectionId }, update: data, create: { id: testId(`report-${key}`), ...data } });
      }
      for (const key of ['03', '05']) {
        const jobId = testId(`job-${key}`);
        const data = { jobId, token: `SYNTHETIC-LOCAL-TRACKING-${key}`, clientEmail: `client-${key}@example.test`, smsOptIn: false, clientPhone: null };
        await tx.clientTrackingToken.upsert({ where: { jobId }, update: data, create: { id: testId(`tracking-${key}`), ...data } });
      }

      for (const [index, converted] of [false, false, true].entries()) {
        const id = testId(`lead-${index + 1}`);
        const data = {
          sessionToken: `SYNTHETIC-LOCAL-LEAD-${index + 1}`, email: `lead-${index + 1}@example.test`, name: `Synthetic Lead ${index + 1}`,
          phone: null, address: `${201 + index} Synthetic Test Lane (fictional)`, city: 'Indianapolis', state: 'IN', zip: '46201',
          source: 'synthetic-local-test', pageUrl: '/book', converted, notificationSent: index !== 1, lastActivityAt: at(0, 8),
        };
        await tx.leadCapture.upsert({ where: { id }, update: data, create: { id, ...data } });
      }
      for (const [index, status] of ['new', 'contacted'].entries()) {
        const id = testId(`contact-${index + 1}`);
        const data = {
          name: `Synthetic Contact ${index + 1}`, email: `contact-${index + 1}@example.test`, phone: null,
          message: 'SYNTHETIC TEST REQUEST. Fictional customer; no service, payment, or notification is requested.',
          serviceType: 'sewer-inspection', source: 'synthetic-local-test', status,
          propertyAddress: `${301 + index} Synthetic Test Lane (fictional)`, propertyCity: 'Indianapolis', propertyState: 'IN', propertyZip: '46201',
          stripeSessionId: null, amountPaid: null, paidAt: null,
        };
        await tx.contactSubmission.upsert({ where: { id }, update: data, create: { id, ...data } });
      }
      const conversationId = testId('conversation-dispatch');
      const conversation = { title: 'Synthetic test dispatch conversation', isGroup: false };
      await tx.conversation.upsert({ where: { id: conversationId }, update: conversation, create: { id: conversationId, ...conversation } });
      for (const userId of [technicianId, managerId]) {
        const data = { conversationId, userId, lastReadAt: userId === managerId ? at(0, 9) : null };
        await tx.conversationParticipant.upsert({
          where: { conversationId_userId: { conversationId, userId } }, update: data,
          create: { id: testId(`participant-${userId}`), ...data },
        });
      }
      for (const [index, content] of [
        'Synthetic dispatch note: use PSI-TEST-05 to inspect the on-site workflow.',
        'Synthetic technician reply: the address is fictional and no visit is scheduled.',
        'Synthetic unread note: pending and failed upload fixtures contain no stored files.',
      ].entries()) {
        const id = testId(`message-${index + 1}`);
        const data = { conversationId, senderId: index === 1 ? technicianId : managerId, content, isRead: index < 2, createdAt: at(0, 8 + index) };
        await tx.message.upsert({ where: { id }, update: data, create: { id, ...data } });
      }
    }, { timeout: 30_000 });
    console.log(`Test seed complete: ${testUsers.length} accounts, ${jobScenarios.length} jobs, 12 inspections, ${serviceAreas.length} areas, ${serviceOfferings.length} services, ${faqs.length} FAQs. No external integrations called.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  // Prisma errors can include connection details; expose only our credential-free guard messages.
  const message = error instanceof Error && !error.name.startsWith('Prisma') ? error.message : 'Database operation failed; check the dedicated local PostgreSQL service and schema.';
  console.error(`Test seed failed: ${message}`);
  process.exitCode = 1;
});
