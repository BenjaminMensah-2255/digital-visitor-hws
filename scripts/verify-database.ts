import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";

const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl) throw new Error("DATABASE_URL is not configured.");
const databaseUrl = /[?&]connect_timeout=/.test(configuredUrl)
  ? configuredUrl
  : `${configuredUrl}${configuredUrl.includes("?") ? "&" : "?"}connect_timeout=15`;
const db = new PrismaClient({ datasourceUrl: databaseUrl });

async function main() {
  await db.$queryRaw`SELECT 1`;
  const [companies, users, visits, attendance, roleCounts] = await Promise.all([
    db.company.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { users: { where: { active: true, role: UserRole.COMPANY_ADMIN } } } } },
    }),
    db.user.count(),
    db.visit.count(),
    db.attendance.count(),
    db.user.groupBy({ by: ["role"], where: { active: true }, _count: true }),
  ]);

  const missingAdmins = companies.filter((company) => company._count.users === 0);
  const roles = new Map(roleCounts.map((entry) => [entry.role, entry._count]));
  const missingRoles = Object.values(UserRole).filter((role) => !roles.get(role));

  console.log(`Database connected: ${companies.length} active companies, ${users} users, ${visits} visits, ${attendance} attendance records.`);
  console.log(`Active roles: ${Object.values(UserRole).map((role) => `${role}=${roles.get(role) ?? 0}`).join(", ")}`);

  if (missingAdmins.length) throw new Error(`Active companies without an active Company Admin: ${missingAdmins.map((company) => company.name).join(", ")}`);
  if (missingRoles.length) throw new Error(`Demo data is missing active roles: ${missingRoles.join(", ")}`);
  console.log("Database readiness checks passed.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
