import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@precisionsewerinspections.com" },
    update: {},
    create: {
      email: "admin@precisionsewerinspections.com",
      passwordHash: adminPassword,
      name: "Admin User",
      phone: "(317) 620-3858",
      role: "ADMIN",
      certifications: ["InterNACHI"],
    },
  });
  console.log("Created admin user:", admin.email);

  // Create test technician
  const techPassword = await bcrypt.hash("tech123", 12);
  const technician = await prisma.user.upsert({
    where: { email: "tech@precisionsewerinspections.com" },
    update: {},
    create: {
      email: "tech@precisionsewerinspections.com",
      passwordHash: techPassword,
      name: "John Technician",
      phone: "(317) 555-0123",
      role: "TECHNICIAN",
      certifications: ["InterNACHI", "NASSCO PACP"],
    },
  });
  console.log("Created technician user:", technician.email);

  // Create super admin user
  const superAdminPassword = await bcrypt.hash("superadmin123", 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@precisionsewerinspections.com" },
    update: {},
    create: {
      email: "superadmin@precisionsewerinspections.com",
      passwordHash: superAdminPassword,
      name: "Super Admin",
      phone: "(317) 620-3858",
      role: "SUPER_ADMIN",
      certifications: ["InterNACHI"],
    },
  });
  console.log("Created super admin user:", superAdmin.email);

  // Create a test job
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const job = await prisma.job.upsert({
    where: { jobNumber: "PSI-2026-001" },
    update: {},
    create: {
      jobNumber: "PSI-2026-001",
      clientName: "Jane Homebuyer",
      clientEmail: "jane.buyer@example.com",
      clientPhone: "(317) 555-9876",
      clientRole: "BUYER",
      propertyAddress: "123 Main Street",
      propertyCity: "Indianapolis",
      propertyState: "IN",
      propertyZip: "46227",
      propertyLat: 39.7684,
      propertyLng: -86.1581,
      scheduledDate: tomorrow,
      scheduledTime: "10:00 AM",
      accessType: "CLEANOUT",
      hasCrawlSpace: false,
      specialNotes: "Access cleanout is in the backyard near the fence",
      basePrice: 200,
      accessFee: 0,
      totalPrice: 200,
      technicianId: technician.id,
      status: "ASSIGNED",
    },
  });
  console.log("Created test job:", job.jobNumber);

  // Create another test job
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(14, 0, 0, 0);

  const job2 = await prisma.job.upsert({
    where: { jobNumber: "PSI-2026-002" },
    update: {},
    create: {
      jobNumber: "PSI-2026-002",
      clientName: "Bob Realtor",
      clientEmail: "bob.realtor@realty.com",
      clientPhone: "(317) 555-4321",
      clientRole: "REALTOR",
      propertyAddress: "456 Oak Avenue",
      propertyCity: "Carmel",
      propertyState: "IN",
      propertyZip: "46032",
      propertyLat: 39.9784,
      propertyLng: -86.1180,
      scheduledDate: dayAfter,
      scheduledTime: "2:00 PM",
      accessType: "ROOF_VENT",
      hasCrawlSpace: true,
      specialNotes: "Seller will not be present. Lockbox code: 1234",
      basePrice: 200,
      accessFee: 100, // Roof vent + crawl space
      totalPrice: 300,
      technicianId: technician.id,
      status: "ASSIGNED",
    },
  });
  console.log("Created test job:", job2.jobNumber);

  console.log("\n✅ Database seeded successfully!");
  console.log("\nTest Accounts:");
  console.log("  Admin: admin@precisionsewerinspections.com / admin123");
  console.log("  Technician: tech@precisionsewerinspections.com / tech123");
  console.log("  Super Admin: superadmin@precisionsewerinspections.com / superadmin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
