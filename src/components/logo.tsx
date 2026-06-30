export function Logo({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`grid size-9 shrink-0 place-items-center rounded-md border ${inverse ? "border-white/30 text-white" : "border-teal-700 bg-teal-700 text-white"}`}>
        <svg viewBox="0 0 32 32" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M8 5h16v22H8z"/><path d="M12 11h8M12 16h8M12 21h4"/><path d="m19 21 2 2 4-5"/></svg>
      </div>
      {!compact && <div><div className={`text-[17px] font-semibold tracking-tight ${inverse ? "text-white" : "text-slate-900"}`}>Visentry</div><div className={`text-[11px] ${inverse ? "text-white/60" : "text-slate-500"}`}>Digital visitor log</div></div>}
    </div>
  );
}
