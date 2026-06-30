import { UserRole } from "@prisma/client";
import { createCompanyAction, toggleCompanyAction, updateCompanyAction } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { ActiveBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export default async function CompaniesPage() {
  await requireUser([UserRole.SYSTEM_ADMIN]);
  const companies = await db.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, staff: true, visits: true } } },
  });

  return <>
    <PageHeader eyebrow="System administration" title="Companies" description="Create isolated tenant workspaces with their first administrator. Deactivation immediately blocks all company access."/>
    <div className="grid gap-6 xl:grid-cols-[410px_1fr]">
      <section className="panel self-start">
        <div className="panel-header"><div><h2 className="panel-title">Add a company</h2><p className="panel-subtitle">Create the workspace and its first admin</p></div><span className="metric-icon text-teal-700"><Icon name="building" className="size-[18px]"/></span></div>
        <ActionForm action={createCompanyAction} className="space-y-5 p-5">
          <fieldset className="space-y-4"><legend className="mb-3 text-xs font-bold uppercase tracking-[.12em] text-slate-400">Company details</legend><label className="field"><span>Company name *</span><input name="name" placeholder="e.g. Northstar Labs" required minLength={2}/></label><label className="field"><span>Workspace slug</span><input name="slug" placeholder="Generated from company name"/></label><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><label className="field"><span>Contact email</span><input name="email" type="email" placeholder="office@company.com"/></label><label className="field"><span>Phone</span><input name="phone" placeholder="+1 312 555 0100"/></label></div><label className="field"><span>Address</span><textarea name="address" placeholder="Street, city, region"/></label></fieldset>
          <fieldset className="space-y-4 border-t border-slate-100 pt-5"><legend className="mb-3 text-xs font-bold uppercase tracking-[.12em] text-slate-400">First company administrator</legend><label className="field"><span>Administrator name *</span><input name="adminName" required minLength={2} placeholder="Full name"/></label><label className="field"><span>Administrator email *</span><input name="adminEmail" type="email" required placeholder="admin@company.com"/></label><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><label className="field"><span>Phone</span><input name="adminPhone" placeholder="Optional"/></label><label className="field"><span>Department *</span><input name="adminDepartment" required defaultValue="Administration"/></label></div><label className="field"><span>Temporary password *</span><input name="adminPassword" type="password" required minLength={8} placeholder="8+ characters, with a letter and number"/><small className="text-[11px] leading-4 text-slate-400">Share this securely. The administrator can change it from their profile.</small></label></fieldset>
          <SubmitButton className="button primary w-full"><Icon name="plus" className="size-4"/>Create company and admin</SubmitButton>
        </ActionForm>
      </section>

      <section className="panel min-w-0">
        <div className="panel-header"><div><h2 className="panel-title">Company directory</h2><p className="panel-subtitle">{companies.length} tenant workspace{companies.length === 1 ? "" : "s"}</p></div></div>
        {companies.length ? <div className="divide-y divide-slate-100">{companies.map((company) => <div key={company.id} className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2.5"><h3 className="font-bold text-slate-850">{company.name}</h3><ActiveBadge active={company.active}/></div><p className="mt-1 text-xs text-slate-400">/{company.slug} · created {formatDateTime(company.createdAt)}</p></div><div className="flex flex-wrap gap-5 text-center"><div><p className="text-lg font-bold text-slate-800">{company._count.users}</p><p className="text-[10px] uppercase tracking-wide text-slate-400">Users</p></div><div><p className="text-lg font-bold text-slate-800">{company._count.staff}</p><p className="text-[10px] uppercase tracking-wide text-slate-400">Staff</p></div><div><p className="text-lg font-bold text-slate-800">{company._count.visits}</p><p className="text-[10px] uppercase tracking-wide text-slate-400">Visits</p></div></div></div>
          <div className="mt-4 flex flex-wrap items-start gap-2"><details className="group grow"><summary className="button secondary w-full sm:w-auto">Edit details</summary><ActionForm action={updateCompanyAction} className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"><input type="hidden" name="id" value={company.id}/><label className="field"><span>Name *</span><input name="name" defaultValue={company.name} required/></label><label className="field"><span>Email</span><input name="email" type="email" defaultValue={company.email ?? ""}/></label><label className="field"><span>Phone</span><input name="phone" defaultValue={company.phone ?? ""}/></label><label className="field"><span>Address</span><input name="address" defaultValue={company.address ?? ""}/></label><div className="sm:col-span-2"><SubmitButton>Save changes</SubmitButton></div></ActionForm></details><ActionForm action={toggleCompanyAction}><input type="hidden" name="id" value={company.id}/><input type="hidden" name="active" value={String(!company.active)}/><SubmitButton className={`button ${company.active ? "danger" : "soft"}`} pendingText="Updating…">{company.active ? "Deactivate" : "Activate"}</SubmitButton></ActionForm></div>
        </div>)}</div> : <div className="empty-state">No companies have been created.</div>}
      </section>
    </div>
  </>;
}
