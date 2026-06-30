"use client";

import { useEffect } from "react";
import { Icon } from "@/components/icon";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const databaseUnavailable = error.message.includes("Can't reach database server") || error.message.includes("P1001");

  return <section className="panel mx-auto mt-12 max-w-xl p-8 text-center">
    <span className="mx-auto grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-700"><Icon name="wait" className="size-6"/></span>
    <h1 className="mt-5 text-xl font-bold text-slate-900">{databaseUnavailable ? "The database is waking up" : "This page couldn’t be loaded"}</h1>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{databaseUnavailable ? "Neon pauses inactive databases to save resources. Give it a few seconds, then retry the page." : "A temporary error interrupted this request. Please retry, or check the development console if it continues."}</p>
    <button onClick={reset} className="button primary mt-6">Try again</button>
  </section>;
}
