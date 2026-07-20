"use client";

import { useEffect } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Prevents an unexpected route error from exposing implementation details to users. */
export default function GlobalRouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Intentionally do not render or transmit the error: it can contain sensitive context.
  }, []);

  return <main className="app-backdrop grid min-h-screen place-items-center px-5"><section role="alert" className="glass max-w-md rounded-3xl border border-amber-200/15 p-7 text-center"><ShieldAlert aria-hidden="true" className="mx-auto size-6 text-amber-200" /><p className="mt-5 font-mono text-[10px] tracking-[.16em] text-amber-100">TRUSTDNA RECOVERY</p><h1 className="mt-3 text-2xl font-semibold text-white">This workspace needs a refresh.</h1><p className="mt-3 text-sm leading-6 text-slate-400">No private evidence is shown in this message. Try again, then return to your dashboard if the issue continues.</p><Button type="button" onClick={reset} className="mt-6 rounded-xl bg-[#8b78f6] text-white hover:bg-[#9c8aff]"><RefreshCw className="size-4" />Try again</Button></section></main>;
}
