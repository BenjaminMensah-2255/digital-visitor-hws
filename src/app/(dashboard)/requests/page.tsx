import { UserRole } from "@prisma/client";
import { decideVisitAction } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Icon } from "@/components/icon";
import { LiveRefresh } from "@/components/live-refresh";
import { PageHeader } from "@/components/page-header";
import { ApprovalBadge, VisitBadge } from "@/components/status-badge";
import { requireUser, tenantId } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, initials } from "@/lib/format";

export default async function RequestsPage() {
  const user = await requireUser([UserRole.STAFF]);
  const companyId = tenantId(user);
  if (!user.staffProfile) return <div className="form-message error">Your account does not have a staff profile. Contact your company admin.</div>;
  const visits = await db.visit.findMany({
    where: { companyId, hostStaffId: user.staffProfile.id },
    orderBy: [{ approvalStatus: "asc" }, { arrivalTime: "desc" }],
    take: 50,
    include: { visitor: true },
  });
  const pendingCount = visits.filter((visit) => visit.approvalStatus === "PENDING").length;
  return <>
    <PageHeader eyebrow="Host inbox" title="Visitor requests" description="Review visitors who asked to meet with you. Reception sees your decision as soon as it is saved." action={<div className="flex items-center gap-2"><LiveRefresh/><span className="status-badge amber"><span className="status-dot"/>{pendingCount} pending</span></div>}/>
    {visits.length ? <div className="grid gap-4 lg:grid-cols-2">{visits.map((visit) =>
      <article key={visit.id} className="panel p-5">
        <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-xs font-bold text-teal-700">{initials(visit.visitor.fullName)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold text-slate-900">{visit.visitor.fullName}</h2><ApprovalBadge status={visit.approvalStatus}/></div><p className="mt-1 text-xs text-slate-400">{formatDateTime(visit.arrivalTime)}</p></div></div>
        <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Purpose</p><p className="mt-1 text-sm leading-6 text-slate-700">{visit.purpose}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500"><span>{visit.visitor.phone}</span><span>{visit.visitor.email ?? "No email provided"}</span></div></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><VisitBadge status={visit.status}/>{visit.decisionTime && <span className="text-[11px] text-slate-400">Decided {formatDateTime(visit.decisionTime)}</span>}</div>
        <ActionForm action={decideVisitAction} className="mt-4 border-t border-slate-100 pt-4"><input type="hidden" name="id" value={visit.id}/><label className="field"><span>Optional message to reception</span><input name="responseMessage" defaultValue={visit.responseMessage ?? ""} placeholder="Add context for your decision"/></label><div className="mt-3 grid grid-cols-3 gap-2"><SubmitButton name="decision" value="APPROVED" className="button soft px-2" pendingText="Saving…"><Icon name="check" className="size-4"/>Approve</SubmitButton><SubmitButton name="decision" value="WAIT" className="button secondary px-2" pendingText="Saving…"><Icon name="wait" className="size-4"/>Wait</SubmitButton><SubmitButton name="decision" value="REJECTED" className="button danger px-2" pendingText="Saving…"><Icon name="close" className="size-4"/>Reject</SubmitButton></div></ActionForm>
      </article>
    )}</div> : <section className="panel empty-state">You have no visitor requests yet.</section>}
  </>;
}
