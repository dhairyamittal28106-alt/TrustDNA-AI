"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ScanFace, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useGuardianProfile } from "@/features/guardian/use-guardian-profile";
import type { GuardianState } from "@/features/guardian/types";

const stateStyle: Record<GuardianState, string> = {
  idle: "from-slate-400/30 via-cyan-200/15 to-violet-400/25",
  monitoring: "from-cyan-300/35 via-blue-300/15 to-violet-400/30",
  learning: "from-violet-300/40 via-cyan-200/15 to-blue-400/30",
  synchronizing: "from-cyan-200/40 via-teal-300/15 to-blue-400/30",
  thinking: "from-violet-300/40 via-indigo-300/20 to-cyan-300/25",
  investigating: "from-blue-300/40 via-cyan-300/15 to-violet-400/30",
  warning: "from-amber-300/40 via-rose-300/15 to-violet-400/25",
};

export function GuardianRenderer({ state, compact = false }: { state: GuardianState; compact?: boolean }) {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const photo = useGuardianProfile(user?.uid, user?.photoURL);

  return <div aria-label="Holographic Identity Guardian" role="img" className={`relative grid shrink-0 place-items-center overflow-hidden rounded-[1.5rem] border border-cyan-200/15 bg-[#060a20]/85 ${compact ? "size-28" : "aspect-square w-full max-w-[18rem]"}`}><div aria-hidden="true" className={`absolute inset-0 bg-gradient-to-br ${stateStyle[state]} opacity-80`} /><motion.div aria-hidden="true" animate={reduceMotion ? undefined : { y: [0, -5, 0], scale: [1, 1.015, 1] }} transition={{ duration: 3.8, ease: "easeInOut", repeat: Infinity }} className="relative grid size-[68%] place-items-center rounded-full border border-cyan-100/25 bg-[#0a1537]/60 shadow-[0_0_70px_rgba(103,232,249,.24)]"><div className="absolute inset-[-14%] rounded-full border border-dashed border-cyan-100/25 [animation:spin_14s_linear_infinite]" /><div className="absolute inset-[-27%] rounded-full border border-violet-200/15 [animation:spin_20s_linear_infinite_reverse]" />{photo ? <span className="relative size-[76%] rounded-full border border-white/30 bg-cover bg-center shadow-[inset_0_0_32px_rgba(125,211,252,.35)]" style={{ backgroundImage: `linear-gradient(rgba(34,211,238,.12), rgba(139,92,246,.2)), url("${photo}")` }} /> : <span className="relative grid size-[76%] place-items-center rounded-full border border-cyan-100/20 bg-gradient-to-b from-cyan-200/15 to-violet-400/20 text-cyan-100"><ScanFace aria-hidden="true" className="size-[48%]" /></span>}<span className="absolute bottom-[6%] right-[10%] grid size-7 place-items-center rounded-full border border-cyan-100/35 bg-[#07112a] text-cyan-100"><Sparkles aria-hidden="true" className="size-3.5" /></span></motion.div><div aria-hidden="true" className="absolute inset-x-[15%] bottom-[13%] h-7 rounded-[100%] bg-cyan-300/20 blur-xl" /></div>;
}
