import { UserRole } from "@prisma/client";
import { clockAction } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { requireUser, tenantId } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatTime, initials } from "@/lib/format";

export default async function AttendancePage() {
  const user = await requireUser([UserRole.COMPANY_ADMIN, UserRole.STAFF]);
  const companyId = tenantId(user);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (user.role === UserRole.STAFF) {
    if (!user.staffProfile) return <div className="form-message error">Your staff profile is missing.</div>;
    const [todayRecord, history] = await Promise.all([
      db.attendance.findUnique({ where: { staffId_date: { staffId: user.staffProfile.id, date: today } } }),
      db.attendance.findMany({ where: { companyId, staffId: user.staffProfile.id }, orderBy: { date: "desc" }, take: 30 }),
    ]);
    const isClockedIn = !!todayRecord && !todayRecord.logoutTime;
    return <><PageHeader eyebrow="My workday" title="Staff attendance" description="Clock in when your day starts and clock out before you leave."/><section className="panel mb-6 overflow-hidden"><div className="grid items-center gap-6 bg-[#063f3d] p-6 text-white sm:grid-cols-[1fr_auto]"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-teal-200">Today’s status</p><h2 className="mt-2 text-2xl font-bold">{isClockedIn ? "You’re clocked in" : todayRecord ? "Workday complete" : "Ready to begin?"}</h2><p className="mt-2 text-sm text-teal-50/70">{todayRecord ? `Started at ${formatTime(todayRecord.loginTime)}${todayRecord.logoutTime ? ` · Finished at ${formatTime(todayRecord.logoutTime)}` : ""}` : "No attendance entry has been recorded today."}</p></div><ActionForm action={clockAction} className="min-w-40"><input type="hidden" name="operation" value={isClockedIn ? "out" : "in"}/><SubmitButton disabled={!!todayRecord?.logoutTime} className="button bg-white px-6 py-3 text-teal-800 hover:bg-teal-50" pendingText="Updating…"><Icon name="clock" className="size-4"/>{isClockedIn ? "Clock out" : "Clock in"}</SubmitButton></ActionForm></div></section><section className="panel"><div className="panel-header"><div><h2 className="panel-title">My attendance history</h2><p className="panel-subtitle">Your 30 most recent workdays</p></div></div>{history.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Date</th><th>Clock in</th><th>Clock out</th><th>Hours</th></tr></thead><tbody>{history.map((item) => { const hours = item.logoutTime ? ((item.logoutTime.getTime() - item.loginTime.getTime()) / 3_600_000).toFixed(1) : "—"; return <tr key={item.id}><td className="font-semibold text-slate-700">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(item.date)}</td><td>{formatTime(item.loginTime)}</td><td>{formatTime(item.logoutTime)}</td><td>{hours}</td></tr>; })}</tbody></table></div> : <div className="empty-state">No attendance history yet.</div>}</section></>;
  }

  const attendance = await db.attendance.findMany({ where: { companyId }, orderBy: [{ date: "desc" }, { loginTime: "desc" }], take: 100, include: { staff: true } });
  const clockedIn = attendance.filter((item) => item.date.getTime() === today.getTime() && !item.logoutTime).length;
  return <><PageHeader eyebrow="Team operations" title="Attendance history" description="View staff clock-in and clock-out activity. Records are retained as part of the company history." action={<span className="status-badge green"><span className="status-dot"/>{clockedIn} currently clocked in</span>}/><section className="panel">{attendance.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Staff member</th><th>Department</th><th>Date</th><th>Clock in</th><th>Clock out</th><th>Hours</th></tr></thead><tbody>{attendance.map((item) => { const hours = item.logoutTime ? ((item.logoutTime.getTime() - item.loginTime.getTime()) / 3_600_000).toFixed(1) : "—"; return <tr key={item.id}><td><div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-600">{initials(item.staff.name)}</span><span className="font-semibold text-slate-700">{item.staff.name}</span></div></td><td>{item.staff.department}</td><td>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(item.date)}</td><td>{formatTime(item.loginTime)}</td><td>{item.logoutTime ? formatTime(item.logoutTime) : <span className="status-badge green"><span className="status-dot"/>On site</span>}</td><td>{hours}</td></tr>; })}</tbody></table></div> : <div className="empty-state">No attendance records yet.</div>}</section></>;
}
