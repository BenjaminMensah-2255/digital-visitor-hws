import { ApprovalStatus, Prisma, UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

function csv(value: unknown) {
  let string = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(string)) string = `'${string}`;
  return `"${string.replaceAll('"', '""')}"`;
}

function parsedDate(value: string | null, end = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  if (end) date.setDate(date.getDate() + 1);
  return date;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!([UserRole.COMPANY_ADMIN, UserRole.RECEPTION] as UserRole[]).includes(user.role) || !user.companyId) return Response.json({ error: "You do not have permission to export visitor reports." }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const from = parsedDate(params.get("from"));
  const to = parsedDate(params.get("to"), true);
  const statusValue = params.get("status") as ApprovalStatus | null;
  const status = statusValue && Object.values(ApprovalStatus).includes(statusValue) ? statusValue : undefined;
  const visitor = params.get("visitor")?.trim();
  const host = params.get("host")?.trim();
  const where: Prisma.VisitWhereInput = {
    companyId: user.companyId,
    ...(from || to ? { arrivalTime: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
    ...(visitor ? { visitor: { fullName: { contains: visitor, mode: "insensitive" } } } : {}),
    ...(host ? { hostStaffId: host } : {}),
    ...(status ? { approvalStatus: status } : {}),
  };
  const visits = await db.visit.findMany({ where, orderBy: { arrivalTime: "desc" }, take: 5000, include: { visitor: true, hostStaff: true } });
  const headings = ["Visitor", "Phone", "Email", "ID Type", "ID Number", "Purpose", "Host", "Department", "Arrival", "Approval", "Visit Status", "Decision Time", "Response", "Check In", "Check Out"];
  const rows = visits.map((visit) => [visit.visitor.fullName, visit.visitor.phone, visit.visitor.email, visit.visitor.idType, visit.visitor.idNumber, visit.purpose, visit.hostStaff.name, visit.hostStaff.department, visit.arrivalTime.toISOString(), visit.approvalStatus, visit.status, visit.decisionTime?.toISOString(), visit.responseMessage, visit.checkInTime?.toISOString(), visit.checkOutTime?.toISOString()]);
  const output = [headings, ...rows].map((row) => row.map(csv).join(",")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(`\uFEFF${output}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="visitor-report-${date}.csv"`, "Cache-Control": "private, no-store" } });
}
