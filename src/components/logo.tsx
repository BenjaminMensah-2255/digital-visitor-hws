export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-800/20">
        <svg viewBox="0 0 32 32" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 5h18v22H7z"/><path d="M12 11h8M12 16h8M12 21h5"/><path d="m20 21 2 2 4-5"/></svg>
      </div>
      {!compact && <div><div className="text-base font-bold tracking-tight text-slate-900">Visentry</div><div className="text-[10px] font-semibold uppercase tracking-[.2em] text-slate-400">Visitor management</div></div>}
    </div>
  );
}
