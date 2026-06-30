export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-teal-600">{eyebrow}</p>}<h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{title}</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p></div>{action}</div>;
}
