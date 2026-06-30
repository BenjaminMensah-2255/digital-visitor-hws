import Link from "next/link";
import { ApprovalStatus, Prisma, UserRole } from "@prisma/client";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { ApprovalBadge, VisitBadge } from "@/components/status-badge";
import { requireUser, tenantId } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, initials } from "@/lib/format";

type Search = { from?: string; to?: string; visitor?: string; host?: string; status?: string };

function dateValue(value: string | undefined, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setDate(date.getDate() + 1);
  return date;
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUser([UserRole.COMPANY_ADMIN, UserRole.RECEPTION]);
  const companyId = tenantId(user);
  const query = await searchParams;
  const from = dateValue(query.from);
  const to = dateValue(query.to, true);
  const validStatus = Object.values(ApprovalStatus).includes(query.status as ApprovalStatus) ? query.status as ApprovalStatus : undefined;
  const where: Prisma.VisitWhereInput = {
    companyId,
    ...(from || to ? { arrivalTime: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
    ...(query.visitor ? { visitor: { fullName: { contains: query.visitor, mode: "insensitive" } } } : {}),
    ...(query.host ? { hostStaffId: query.host } : {}),
    ...(validStatus ? { approvalStatus: validStatus } : {}),
  };
  const [visits, hosts] = await Promise.all([
    db.visit.findMany({ where, orderBy: { arrivalTime: "desc" }, take: 250, include: { visitor: true, hostStaff: true } }),
    db.staffProfile.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
  ]);
  const exportParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => { if (value) exportParams.set(key, value); });
  return <>
    <PageHeader eyebrow="Visitor records" title="History & reports" description="Search visitor activity, check decisions and presence, then export the current result set." action={<Link href={`/api/reports/visitors?${exportParams}`} className="button primary"><Icon name="download" className="size-4"/>Export CSV</Link>}/>
    <section className="panel mb-6"><form className="grid items-end gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" action="/reports"><label className="field"><span>From date</span><input name="from" type="date" defaultValue={query.from}/></label><label className="field"><span>To date</span><input name="to" type="date" defaultValue={query.to}/></label><label className="field lg:col-span-2"><span>Visitor name</span><input name="visitor" placeholder="Search by name" defaultValue={query.visitor}/></label><label className="field"><span>Host</span><select name="host" defaultValue={query.host ?? ""}><option value="">All hosts</option>{hosts.map((host) => <option key={host.id} value={host.id}>{host.name}</option>)}</select></label><label className="field"><span>Approval</span><select name="status" defaultValue={query.status ?? ""}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="WAIT">Please wait</option></select></label><div className="flex gap-2 sm:col-span-2 lg:col-span-6"><button className="button primary" type="submit"><Icon name="search" className="size-4"/>Apply filters</button><Link href="/reports" className="button secondary">Clear</Link></div></form></section>
    <section className="panel"><div className="panel-header"><div><h2 className="panel-title">Visitor log</h2><p className="panel-subtitle">{visits.length} matching record{visits.length === 1 ? "" : "s"}{visits.length === 250 ? " · showing first 250" : ""}</p></div></div>{visits.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Visitor</th><th>Host & purpose</th><th>Arrival</th><th>Approval</th><th>Presence</th><th>Decision</th></tr></thead><tbody>{visits.map((visit) => <tr key={visit.id}><td><div className="flex items-center gap-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{initials(visit.visitor.fullName)}</span><div><p className="font-semibold text-slate-800">{visit.visitor.fullName}</p><p className="mt-0.5 text-[11px] text-slate-400">{visit.visitor.phone}</p></div></div></td><td><p className="font-medium text-slate-700">{visit.hostStaff.name}</p><p className="mt-0.5 max-w-52 truncate text-[11px] text-slate-400">{visit.purpose}</p></td><td className="whitespace-nowrap">{formatDateTime(visit.arrivalTime)}</td><td><ApprovalBadge status={visit.approvalStatus}/></td><td><VisitBadge status={visit.status}/></td><td className="max-w-48"><p className="text-xs">{visit.decisionTime ? formatDateTime(visit.decisionTime) : "—"}</p>{visit.responseMessage && <p className="mt-1 truncate text-[11px] text-slate-400" title={visit.responseMessage}>{visit.responseMessage}</p>}</td></tr>)}</tbody></table></div> : <div className="empty-state"><Icon name="search" className="mx-auto mb-3 size-6"/>No visitor records match these filters.</div>}</section>
  </>;
}
