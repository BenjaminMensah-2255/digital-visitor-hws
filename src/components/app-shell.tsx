import Link from "next/link";
import { UserRole } from "@prisma/client";
import { logoutAction } from "@/app/actions";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/logo";
import { initials, roleLabel } from "@/lib/format";

type ShellUser = { name: string; email: string; role: UserRole; company: { name: string } | null };
type NavigationItem = { href: string; label: string; icon: Parameters<typeof Icon>[0]["name"]; roles: UserRole[] };
const navigation: NavigationItem[] = [
  { href: "/dashboard", label: "Overview", icon: "dashboard" as const, roles: Object.values(UserRole) },
  { href: "/companies", label: "Companies", icon: "companies" as const, roles: [UserRole.SYSTEM_ADMIN] },
  { href: "/staff", label: "Staff management", icon: "staff" as const, roles: [UserRole.COMPANY_ADMIN] },
  { href: "/visitors/new", label: "Visitor desk", icon: "visitor" as const, roles: [UserRole.RECEPTION] },
  { href: "/requests", label: "Visit requests", icon: "requests" as const, roles: [UserRole.STAFF] },
  { href: "/reports", label: "Visitor reports", icon: "reports" as const, roles: [UserRole.COMPANY_ADMIN, UserRole.RECEPTION] },
  { href: "/attendance", label: "Attendance", icon: "attendance" as const, roles: [UserRole.COMPANY_ADMIN, UserRole.STAFF] },
  { href: "/profile", label: "My profile", icon: "users" as const, roles: Object.values(UserRole) },
];

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const items = navigation.filter((item) => item.roles.includes(user.role));
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  return <div className="min-h-screen bg-[#f5f7f9] lg:grid lg:grid-cols-[254px_1fr]">
    <aside className="hidden min-h-screen flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex"><div className="px-2"><Logo /></div><div className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Workspace</div><nav className="mt-2 space-y-1">{items.map((item) => <Link key={item.href} href={item.href} className="nav-link"><Icon name={item.icon} className="size-[18px]" />{item.label}</Link>)}</nav><div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-3.5"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">{initials(user.name)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{user.name}</p><p className="truncate text-[11px] text-slate-500">{roleLabel(user.role)}</p></div></div><form action={logoutAction} className="mt-3"><button className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"><Icon name="logout" className="size-4" />Log out</button></form></div></aside>
    <div className="min-w-0"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="flex h-16 items-center justify-between px-4 sm:px-7 lg:px-9"><div className="lg:hidden"><Logo compact /></div><div className="hidden lg:block"><p className="text-sm font-semibold text-slate-700">{user.company?.name ?? "System workspace"}</p><p className="text-xs text-slate-400">{today}</p></div><div className="flex items-center gap-3"><span className="hidden text-right sm:block"><span className="block text-xs font-semibold text-slate-700">{user.name}</span><span className="block text-[11px] text-slate-400">{user.email}</span></span><span className="grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">{initials(user.name)}</span></div></div><nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden">{items.map((item) => <Link key={item.href} href={item.href} className="mobile-nav-link"><Icon name={item.icon} className="size-4" />{item.label}</Link>)}</nav></header><main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-9">{children}</main></div>
  </div>;
}
