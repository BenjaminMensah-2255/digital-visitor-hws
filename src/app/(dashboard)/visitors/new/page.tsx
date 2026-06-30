import { ApprovalStatus, UserRole, VisitStatus } from "@prisma/client";
import { registerVisitorAction, updateVisitStatusAction } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Icon } from "@/components/icon";
import { LiveRefresh } from "@/components/live-refresh";
import { PageHeader } from "@/components/page-header";
import { ApprovalBadge, VisitBadge } from "@/components/status-badge";
import { requireUser, tenantId } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatTime, initials } from "@/lib/format";

function defaultArrival() {
  const value = new Date(Date.now() + 30 * 60 * 1000);
  value.setMinutes(Math.ceil(value.getMinutes() / 5) * 5, 0, 0);
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export default async function VisitorDeskPage() {
  const user = await requireUser([UserRole.RECEPTION]);
  const companyId = tenantId(user);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const [hosts, visits] = await Promise.all([
    db.staffProfile.findMany({ where: { companyId, active: true, user: { active: true, role: UserRole.STAFF } }, orderBy: { name: "asc" } }),
    db.visit.findMany({ where: { companyId, arrivalTime: { gte: start, lt: end } }, orderBy: { arrivalTime: "asc" }, include: { visitor: true, hostStaff: true } }),
  ]);

  return <>
    <PageHeader eyebrow="Front desk" title="Visitor registration" description="Register an arrival and send an approval request directly to the selected host." action={<LiveRefresh/>}/>
    <div className="grid items-start gap-6 xl:grid-cols-[1.05fr_.95fr]">
      <section className="panel">
        <div className="panel-header"><div><h2 className="panel-title">New visitor</h2><p className="panel-subtitle">Fields marked with * are required</p></div><span className="metric-icon text-teal-700"><Icon name="visitor" className="size-[18px]"/></span></div>
        <ActionForm action={registerVisitorAction} className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="field"><span>Full name *</span><input name="fullName" required placeholder="Visitor’s full name"/></label>
          <label className="field"><span>Phone number *</span><input name="phone" required minLength={7} placeholder="Contact number"/></label>
          <label className="field"><span>Email address</span><input name="email" type="email" placeholder="Optional"/></label>
          <label className="field"><span>Arrival time *</span><input name="arrivalTime" type="datetime-local" required defaultValue={defaultArrival()}/></label>
          <label className="field"><span>ID type</span><select name="idType" defaultValue=""><option value="">Not provided</option><option>Driver&apos;s license</option><option>Passport</option><option>National ID</option><option>Employee ID</option></select></label>
          <label className="field"><span>ID number</span><input name="idNumber" placeholder="Optional reference"/></label>
          <label className="field sm:col-span-2"><span>Host staff member *</span><select name="hostStaffId" required defaultValue=""><option value="" disabled>Select a host</option>{hosts.map((host) => <option key={host.id} value={host.id}>{host.name} — {host.department}</option>)}</select></label>
          <label className="field sm:col-span-2"><span>Purpose of visit *</span><textarea name="purpose" required minLength={3} placeholder="Briefly describe the purpose of this visit"/></label>
          <div className="sm:col-span-2"><SubmitButton className="button primary w-full sm:w-auto"><Icon name="plus" className="size-4"/>Register and notify host</SubmitButton>{!hosts.length && <p className="mt-2 text-xs text-amber-700">No active staff hosts are available. Ask a company admin to add one.</p>}</div>
        </ActionForm>
      </section>

      <section className="panel min-w-0">
        <div className="panel-header"><div><h2 className="panel-title">Today’s arrivals</h2><p className="panel-subtitle">{visits.length} visitor{visits.length === 1 ? "" : "s"} scheduled</p></div><span className="status-badge green"><span className="status-dot"/>{visits.filter((visit) => visit.status === VisitStatus.CHECKED_IN).length} on site</span></div>
        {visits.length ? <div className="divide-y divide-slate-100">{visits.map((visit) => <div key={visit.id} className="p-4 sm:p-5"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{initials(visit.visitor.fullName)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-slate-850">{visit.visitor.fullName}</h3><span className="text-xs font-bold text-slate-500">{formatTime(visit.arrivalTime)}</span></div><p className="mt-1 truncate text-xs text-slate-500">With {visit.hostStaff.name} · {visit.purpose}</p><div className="mt-3 flex flex-wrap items-center gap-2"><ApprovalBadge status={visit.approvalStatus}/><VisitBadge status={visit.status}/></div>{visit.responseMessage && <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-700">Host: “{visit.responseMessage}”</p>}<div className="mt-3">{visit.approvalStatus === ApprovalStatus.APPROVED && visit.status === VisitStatus.EXPECTED && <ActionForm action={updateVisitStatusAction}><input type="hidden" name="id" value={visit.id}/><input type="hidden" name="status" value={VisitStatus.CHECKED_IN}/><SubmitButton className="button soft" pendingText="Checking in…"><Icon name="check" className="size-4"/>Check in</SubmitButton></ActionForm>}{visit.status === VisitStatus.CHECKED_IN && <ActionForm action={updateVisitStatusAction}><input type="hidden" name="id" value={visit.id}/><input type="hidden" name="status" value={VisitStatus.CHECKED_OUT}/><SubmitButton className="button secondary" pendingText="Checking out…">Check out</SubmitButton></ActionForm>}</div></div></div></div>)}</div> : <div className="empty-state">No arrivals are scheduled today.</div>}
      </section>
    </div>
  </>;
}
