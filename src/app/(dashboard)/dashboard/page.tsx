import Link from "next/link";
import { ApprovalStatus, UserRole } from "@prisma/client";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { ApprovalBadge, VisitBadge } from "@/components/status-badge";
import { requireUser, tenantId } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, initials } from "@/lib/format";

function Metric({ label, value, icon, color, detail }: { label: string; value: number; icon: Parameters<typeof Icon>[0]["name"]; color: string; detail: string }) {
  return <div className="metric-card"><div className={`metric-icon ${color}`}><Icon name={icon} className="size-[18px]" /></div><p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs font-semibold text-slate-600">{label}</p><p className="mt-1 text-[11px] text-slate-400">{detail}</p></div>;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name.split(" ")[0];

  if (user.role === UserRole.SYSTEM_ADMIN) {
    const [companies, activeCompanies, totalUsers, recent] = await Promise.all([
      db.company.count(), db.company.count({ where: { active: true } }), db.user.count(), db.company.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { _count: { select: { users: true, visits: true } } } }),
    ]);
    return <><PageHeader eyebrow="System overview" title={`Good day, ${firstName}`} description="Monitor organizations and access across the Visentry platform." action={<Link href="/companies" className="button primary"><Icon name="plus" className="size-4"/>Manage companies</Link>}/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Total companies" value={companies} icon="building" color="text-teal-700" detail="All tenant workspaces"/><Metric label="Active companies" value={activeCompanies} icon="check" color="text-emerald-700" detail="Available for sign-in"/><Metric label="Platform users" value={totalUsers} icon="users" color="text-blue-700" detail="Across every role"/><Metric label="Inactive companies" value={companies - activeCompanies} icon="wait" color="text-amber-700" detail="Access currently suspended"/></div><section className="panel mt-6"><div className="panel-header"><div><h2 className="panel-title">Recently added companies</h2><p className="panel-subtitle">The newest tenant workspaces</p></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Company</th><th>Users</th><th>Visits</th><th>Status</th></tr></thead><tbody>{recent.map((company) => <tr key={company.id}><td><p className="font-semibold text-slate-800">{company.name}</p><p className="mt-0.5 text-[11px] text-slate-400">{company.slug}</p></td><td>{company._count.users}</td><td>{company._count.visits}</td><td><span className={`status-badge ${company.active ? "green" : "slate"}`}><span className="status-dot"/>{company.active ? "Active" : "Inactive"}</span></td></tr>)}</tbody></table></div></section></>;
  }

  const companyId = tenantId(user);
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const todayFilter = { companyId, arrivalTime: { gte: start, lt: end } };
  const [visitorsToday, pending, approved, rejected, clockedIn, recentVisits] = await Promise.all([
    db.visit.count({ where: todayFilter }),
    db.visit.count({ where: { companyId, approvalStatus: ApprovalStatus.PENDING } }),
    db.visit.count({ where: { ...todayFilter, approvalStatus: ApprovalStatus.APPROVED } }),
    db.visit.count({ where: { ...todayFilter, approvalStatus: ApprovalStatus.REJECTED } }),
    db.attendance.count({ where: { companyId, date: start, logoutTime: null } }),
    db.visit.findMany({ where: user.role === UserRole.STAFF && user.staffProfile ? { companyId, hostStaffId: user.staffProfile.id } : { companyId }, orderBy: { arrivalTime: "desc" }, take: 6, include: { visitor: true, hostStaff: true } }),
  ]);
  const quickLink = user.role === UserRole.RECEPTION ? "/visitors/new" : user.role === UserRole.STAFF ? "/requests" : "/reports";
  const quickLabel = user.role === UserRole.RECEPTION ? "Register visitor" : user.role === UserRole.STAFF ? "Review requests" : "View reports";
  return <><PageHeader eyebrow="Today at a glance" title={`Good day, ${firstName}`} description={`Here’s what is happening at ${user.company?.name ?? "your company"}.`} action={<Link href={quickLink} className="button primary">{user.role === UserRole.RECEPTION && <Icon name="plus" className="size-4"/>}{quickLabel}</Link>}/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Visitors today" value={visitorsToday} icon="visitor" color="text-teal-700" detail="Scheduled arrivals"/><Metric label="Pending approvals" value={pending} icon="clock" color="text-amber-700" detail="Awaiting host response"/><Metric label="Approved" value={approved} icon="check" color="text-emerald-700" detail="Today’s approved visits"/><Metric label="Rejected" value={rejected} icon="close" color="text-rose-700" detail="Today’s declined visits"/><Metric label="Clocked in" value={clockedIn} icon="attendance" color="text-blue-700" detail="Staff currently on site"/></div><section className="panel mt-6"><div className="panel-header"><div><h2 className="panel-title">Recent visitor activity</h2><p className="panel-subtitle">Latest scheduled and completed visits</p></div>{([UserRole.COMPANY_ADMIN, UserRole.RECEPTION] as UserRole[]).includes(user.role) && <Link href="/reports" className="text-xs font-bold text-teal-700 hover:text-teal-900">View all →</Link>}</div>{recentVisits.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Visitor</th><th>Host</th><th>Arrival</th><th>Approval</th><th>Presence</th></tr></thead><tbody>{recentVisits.map((visit) => <tr key={visit.id}><td><div className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{initials(visit.visitor.fullName)}</span><div><p className="font-semibold text-slate-800">{visit.visitor.fullName}</p><p className="mt-0.5 text-[11px] text-slate-400">{visit.purpose}</p></div></div></td><td>{visit.hostStaff.name}</td><td>{formatDateTime(visit.arrivalTime)}</td><td><ApprovalBadge status={visit.approvalStatus}/></td><td><VisitBadge status={visit.status}/></td></tr>)}</tbody></table></div> : <div className="empty-state">No visitor activity yet.</div>}</section></>;
}
