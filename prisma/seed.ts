import { ApprovalStatus, PrismaClient, UserRole, VisitStatus } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

function daysFromNow(days: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const passwordHash = await hashPassword("Demo@123");
  const acme = await prisma.company.create({
    data: {
      name: "Acme Creative Studio",
      slug: "acme-creative",
      email: "hello@acme.demo",
      phone: "+1 312 555 0182",
      address: "233 W Jackson Blvd, Chicago, IL",
    },
  });
  const northstar = await prisma.company.create({
    data: {
      name: "Northstar Labs",
      slug: "northstar-labs",
      email: "office@northstar.demo",
      phone: "+1 312 555 0148",
      address: "401 N Morgan St, Chicago, IL",
    },
  });

  await prisma.user.create({
    data: { name: "Morgan Reed", email: "system@visentry.demo", passwordHash, role: UserRole.SYSTEM_ADMIN },
  });

  const northstarAdmin = await prisma.user.create({
    data: { name: "Riley Chen", email: "admin@northstar.demo", passwordHash, role: UserRole.COMPANY_ADMIN, companyId: northstar.id },
  });
  await prisma.staffProfile.create({
    data: { userId: northstarAdmin.id, companyId: northstar.id, name: northstarAdmin.name, email: northstarAdmin.email, phone: "+1 312 555 0149", department: "Administration" },
  });

  const adminUser = await prisma.user.create({
    data: { name: "Jordan Lee", email: "admin@acme.demo", passwordHash, role: UserRole.COMPANY_ADMIN, companyId: acme.id },
  });
  await prisma.staffProfile.create({
    data: { userId: adminUser.id, companyId: acme.id, name: adminUser.name, email: adminUser.email, phone: "+1 312 555 0101", department: "Operations" },
  });

  const receptionUser = await prisma.user.create({
    data: { name: "Taylor Brooks", email: "reception@acme.demo", passwordHash, role: UserRole.RECEPTION, companyId: acme.id },
  });
  await prisma.staffProfile.create({
    data: { userId: receptionUser.id, companyId: acme.id, name: receptionUser.name, email: receptionUser.email, phone: "+1 312 555 0102", department: "Front Desk" },
  });

  const staffUser = await prisma.user.create({
    data: { name: "Casey Patel", email: "staff@acme.demo", passwordHash, role: UserRole.STAFF, companyId: acme.id },
  });
  const casey = await prisma.staffProfile.create({
    data: { userId: staffUser.id, companyId: acme.id, name: staffUser.name, email: staffUser.email, phone: "+1 312 555 0103", department: "Design" },
  });
  const secondUser = await prisma.user.create({
    data: { name: "Alex Morgan", email: "alex@acme.demo", passwordHash, role: UserRole.STAFF, companyId: acme.id },
  });
  const alex = await prisma.staffProfile.create({
    data: { userId: secondUser.id, companyId: acme.id, name: secondUser.name, email: secondUser.email, phone: "+1 312 555 0104", department: "Engineering" },
  });

  const visitors = await Promise.all([
    prisma.visitor.create({ data: { companyId: acme.id, fullName: "Maya Thompson", phone: "+1 773 555 0112", email: "maya@example.com", idType: "Driver's license", idNumber: "IL••4821" } }),
    prisma.visitor.create({ data: { companyId: acme.id, fullName: "Noah Williams", phone: "+1 312 555 0198", email: "noah@example.com" } }),
    prisma.visitor.create({ data: { companyId: acme.id, fullName: "Sofia Garcia", phone: "+1 708 555 0127", email: "sofia@example.com" } }),
    prisma.visitor.create({ data: { companyId: acme.id, fullName: "Ethan Brown", phone: "+1 847 555 0172" } }),
  ]);

  await prisma.visit.createMany({
    data: [
      { companyId: acme.id, visitorId: visitors[0].id, hostStaffId: casey.id, purpose: "Brand review meeting", arrivalTime: daysFromNow(0, 9), approvalStatus: ApprovalStatus.APPROVED, status: VisitStatus.CHECKED_IN, decisionTime: daysFromNow(0, 8), checkInTime: daysFromNow(0, 9) },
      { companyId: acme.id, visitorId: visitors[1].id, hostStaffId: alex.id, purpose: "Project consultation", arrivalTime: daysFromNow(0, 11), approvalStatus: ApprovalStatus.PENDING, status: VisitStatus.EXPECTED },
      { companyId: acme.id, visitorId: visitors[2].id, hostStaffId: casey.id, purpose: "Portfolio interview", arrivalTime: daysFromNow(0, 14), approvalStatus: ApprovalStatus.WAIT, status: VisitStatus.EXPECTED, decisionTime: daysFromNow(0, 10), responseMessage: "Please ask her to wait in the lounge." },
      { companyId: acme.id, visitorId: visitors[3].id, hostStaffId: alex.id, purpose: "Vendor introduction", arrivalTime: daysFromNow(0, 15), approvalStatus: ApprovalStatus.REJECTED, status: VisitStatus.EXPECTED, decisionTime: daysFromNow(0, 9), responseMessage: "Please reschedule for next week." },
      { companyId: acme.id, visitorId: visitors[0].id, hostStaffId: alex.id, purpose: "Discovery workshop", arrivalTime: daysFromNow(-1, 10), approvalStatus: ApprovalStatus.APPROVED, status: VisitStatus.CHECKED_OUT, decisionTime: daysFromNow(-1, 8), checkInTime: daysFromNow(-1, 10), checkOutTime: daysFromNow(-1, 12) },
    ],
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.attendance.createMany({
    data: [
      { companyId: acme.id, staffId: casey.id, date: today, loginTime: daysFromNow(0, 8) },
      { companyId: acme.id, staffId: alex.id, date: today, loginTime: daysFromNow(0, 8), logoutTime: daysFromNow(0, 17) },
    ],
  });

  console.log("Seeded Digital Visitors Log demo data.");
  console.log("Demo password for every account: Demo@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
