"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LiveRefresh({ intervalMs = 10_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => window.clearInterval(interval);
  }, [intervalMs, router]);

  return <span className="status-badge green" title={`Refreshes every ${intervalMs / 1000} seconds`}><span className="status-dot animate-pulse"/>Live updates</span>;
}
