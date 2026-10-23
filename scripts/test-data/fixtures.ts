import type { AccessType, ClientRole, InspectionStage, InspectionStatus, JobStatus, UserRole } from '@prisma/client';
import { calculateCheckoutPricing, getServiceOption } from '../../lib/checkout-pricing';

export const TEST_PREFIX = 'psi-test-';
export const testId = (name: string) => `${TEST_PREFIX}${name}`;

export const testUsers: Array<{ key: string; role: UserRole; isActive: boolean }> = [
  { key: 'technician', role: 'TECHNICIAN', isActive: true },
  { key: 'manager', role: 'MANAGER', isActive: true },
  { key: 'admin', role: 'ADMIN', isActive: true },
  { key: 'owner', role: 'OWNER', isActive: true },
  { key: 'superadmin', role: 'SUPER_ADMIN', isActive: true },
  { key: 'inactive', role: 'TECHNICIAN', isActive: false },
];

type JobScenario = {
  key: string;
  status: JobStatus;
  accessType: AccessType;
  hasCrawlSpace?: boolean;
  clientRole: ClientRole;
  stage?: InspectionStage;
  inspectionStatus?: InspectionStatus;
};

export const jobScenarios: JobScenario[] = [
  { key: '01', status: 'PENDING', accessType: 'CLEANOUT', clientRole: 'HOMEOWNER' },
  { key: '02', status: 'ASSIGNED', accessType: 'ROOF_VENT', clientRole: 'BUYER' },
  { key: '03', status: 'ACCEPTED', accessType: 'TOILET_PULL', clientRole: 'SELLER', stage: 'ACCEPTED', inspectionStatus: 'IN_PROGRESS' },
  { key: '04', status: 'EN_ROUTE', accessType: 'CLEANOUT', clientRole: 'REALTOR', stage: 'EN_ROUTE', inspectionStatus: 'IN_PROGRESS' },
  { key: '05', status: 'ON_SITE', accessType: 'ROOF_VENT', hasCrawlSpace: true, clientRole: 'PROPERTY_MANAGER', stage: 'ARRIVED', inspectionStatus: 'IN_PROGRESS' },
  { key: '06', status: 'IN_PROGRESS', accessType: 'TOILET_PULL', hasCrawlSpace: true, clientRole: 'OTHER', stage: 'INSPECTING', inspectionStatus: 'IN_PROGRESS' },
  { key: '07', status: 'IN_PROGRESS', accessType: 'CLEANOUT', hasCrawlSpace: true, clientRole: 'HOMEOWNER', stage: 'POST_INSPECTION', inspectionStatus: 'IN_PROGRESS' },
  { key: '08', status: 'IN_PROGRESS', accessType: 'ROOF_VENT', clientRole: 'BUYER', stage: 'VIDEO_ATTACH', inspectionStatus: 'IN_PROGRESS' },
  { key: '09', status: 'IN_PROGRESS', accessType: 'TOILET_PULL', clientRole: 'SELLER', stage: 'VIDEO_ATTACH', inspectionStatus: 'IN_PROGRESS' },
  { key: '10', status: 'COMPLETED', accessType: 'CLEANOUT', clientRole: 'REALTOR', stage: 'SUBMITTED', inspectionStatus: 'SUBMITTED' },
  { key: '11', status: 'COMPLETED', accessType: 'ROOF_VENT', clientRole: 'PROPERTY_MANAGER', stage: 'UNDER_REVIEW', inspectionStatus: 'UNDER_REVIEW' },
  { key: '12', status: 'COMPLETED', accessType: 'TOILET_PULL', hasCrawlSpace: true, clientRole: 'OTHER', stage: 'APPROVED', inspectionStatus: 'APPROVED' },
  { key: '13', status: 'IN_PROGRESS', accessType: 'CLEANOUT', clientRole: 'HOMEOWNER', stage: 'POST_INSPECTION', inspectionStatus: 'REJECTED' },
  { key: '14', status: 'COMPLETED', accessType: 'ROOF_VENT', clientRole: 'BUYER', stage: 'DELIVERED', inspectionStatus: 'DELIVERED' },
  { key: '15', status: 'CANCELLED', accessType: 'UNKNOWN', clientRole: 'SELLER' },
  { key: '16', status: 'PENDING', accessType: 'TOILET_PULL', hasCrawlSpace: true, clientRole: 'HOMEOWNER' },
];

export function jobPricing(scenario: JobScenario) {
  const service = scenario.accessType === 'TOILET_PULL' ? 'sewer-inspection-toilet'
    : scenario.accessType === 'ROOF_VENT' ? 'sewer-inspection-roof' : 'sewer-inspection';
  const pricing = calculateCheckoutPricing(service, scenario.hasCrawlSpace ? ['crawl-space'] : []);
  const basePrice = getServiceOption('sewer-inspection').amountCents / 100;
  return { basePrice, accessFee: pricing.totalCents / 100 - basePrice, totalPrice: pricing.totalCents / 100 };
}
