type IconName =
  | "dashboard" | "companies" | "staff" | "visitor" | "requests" | "reports"
  | "attendance" | "logout" | "search" | "plus" | "download" | "clock"
  | "check" | "close" | "wait" | "building" | "users" | "shield";

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    companies: <><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16"/><path d="M9 7h3M9 11h3M9 15h3M17 9h2a2 2 0 0 1 2 2v10M2 21h20"/></>,
    staff: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    visitor: <><path d="M8 3H5a2 2 0 0 0-2 2v16h18V5a2 2 0 0 0-2-2h-3"/><rect x="8" y="2" width="8" height="5" rx="1"/><circle cx="12" cy="12" r="2"/><path d="M8 19v-1a4 4 0 0 1 8 0v1"/></>,
    requests: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    reports: <><path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/></>,
    attendance: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <path d="M6 6l12 12M18 6 6 18"/>,
    wait: <><path d="M6 2h12M6 22h12M8 2v5l4 5-4 5v5M16 2v5l-4 5 4 5v5"/></>,
    building: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M9 21v-3h6v3"/></>,
    users: <><circle cx="9" cy="8" r="4"/><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2M17 11a3 3 0 1 0 0-6M22 21v-2a4 4 0 0 0-3-3.87"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name]}</svg>;
}
