"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type LivingHologramCoreProps = {
  assembly: boolean;
  active: boolean;
  onInteractionChange?: (active: boolean) => void;
};

const particles = [
  [168, 138, 1.5], [205, 166, 1.2], [255, 144, 1.4], [292, 185, 1.1],
  [182, 225, 1.3], [238, 248, 1.5], [274, 274, 1.1], [165, 304, 1.4],
  [216, 336, 1.2], [281, 360, 1.5], [202, 398, 1.1], [254, 419, 1.3],
] as const;

const neuralPaths = [
  "M230 108C180 158 278 194 220 240C178 274 260 318 228 392",
  "M192 150C246 185 174 220 254 272C289 297 194 342 250 405",
  "M270 137C222 184 292 222 218 292C196 314 257 356 230 422",
] as const;

/**
 * Purely presentational SVG. Its particles and neural routes are deterministic
 * so movement remains a representation of Genome state rather than decoration.
 */
export function LivingHologramCore({ assembly, active, onInteractionChange }: LivingHologramCoreProps) {
  const instanceId = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const bodyGradient = `${instanceId}-genome-body`;
  const edgeGradient = `${instanceId}-genome-edge`;
  const bodyClip = `${instanceId}-genome-clip`;
  const glow = `${instanceId}-genome-glow`;
  const engaged = focused || active;

  function setInteraction(next: boolean) {
    setFocused(next);
    onInteractionChange?.(next);
  }

  return <motion.button
    type="button"
    aria-label="Identity Genome core. Focus the visualization."
    aria-pressed={focused}
    onClick={() => setInteraction(!focused)}
    onPointerEnter={() => setInteraction(true)}
    onPointerLeave={() => setInteraction(false)}
    onFocus={() => setInteraction(true)}
    onBlur={() => setInteraction(false)}
    className={`genome-core group relative z-20 block aspect-[.92] w-[min(58%,17rem)] min-w-40 rounded-full text-cyan-200 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:ring-offset-4 focus-visible:ring-offset-[#06091b] ${engaged ? "genome-core-engaged" : ""}`}
    animate={reduceMotion ? undefined : { scale: engaged ? 1.035 : 1 }}
    transition={{ duration: .35, ease: "easeOut" }}
  >
    <span className="sr-only">The hologram is visualizing consented Identity Genome evidence.</span>
    <span aria-hidden="true" className="genome-core-ambient absolute inset-[-22%] rounded-full" />
    <span aria-hidden="true" className="genome-core-pulse absolute inset-[18%] rounded-full border border-cyan-200/20" />
    <svg aria-hidden="true" className="relative h-full w-full overflow-visible" viewBox="0 0 460 480" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={bodyGradient} x1="230" y1="76" x2="230" y2="432" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity=".45" />
          <stop offset=".5" stopColor="currentColor" stopOpacity=".13" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".02" />
        </linearGradient>
        <linearGradient id={edgeGradient} x1="133" y1="103" x2="324" y2="401" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f1feff" stopOpacity=".9" />
          <stop offset=".42" stopColor="currentColor" stopOpacity=".95" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".15" />
        </linearGradient>
        <clipPath id={bodyClip}>
          <path d="M230 70C184 70 158 108 158 151C158 181 173 205 191 219L174 264C132 287 110 338 105 423H355C350 338 328 287 286 264L269 219C287 205 302 181 302 151C302 108 276 70 230 70Z" />
        </clipPath>
        <filter id={glow} x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="4.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g className="genome-dna-field" opacity=".42">
        <ellipse cx="230" cy="245" rx="174" ry="65" stroke="currentColor" strokeWidth="1" strokeDasharray="3 11" />
        <ellipse cx="230" cy="245" rx="137" ry="49" stroke="currentColor" strokeWidth=".7" strokeDasharray="2 8" />
        <path d="M145 88C307 141 152 223 315 294C174 347 302 397 176 446" stroke="currentColor" strokeWidth=".85" strokeDasharray="4 8" />
        <path d="M315 88C153 141 308 223 145 294C286 347 158 397 284 446" stroke="currentColor" strokeWidth=".85" strokeDasharray="4 8" />
      </g>
      <g className="genome-body-breathe" filter={`url(#${glow})`}>
        <path d="M230 70C184 70 158 108 158 151C158 181 173 205 191 219L174 264C132 287 110 338 105 423H355C350 338 328 287 286 264L269 219C287 205 302 181 302 151C302 108 276 70 230 70Z" fill={`url(#${bodyGradient})`} stroke={`url(#${edgeGradient})`} strokeWidth="1.45" />
        <g clipPath={`url(#${bodyClip})`}>
          {[110, 132, 154, 176, 198, 220, 242, 264, 286, 308, 330, 352, 374, 396, 418].map((y) => <path key={y} d={`M98 ${y}H362`} className="genome-scan-line" stroke="currentColor" strokeWidth=".65" opacity=".43" />)}
          <path d="M230 77V424M176 151H284M168 202H292M153 276H307M126 351H334" stroke="currentColor" strokeWidth=".75" strokeDasharray="3 7" opacity=".55" />
          {neuralPaths.map((path, index) => <path key={path} d={path} className={`genome-neural-flash genome-neural-flash-${index}`} stroke="#e8feff" strokeWidth="1.15" strokeDasharray="3 12" opacity=".8" />)}
          {particles.map(([cx, cy, radius], index) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={radius} className="genome-body-particle" fill="currentColor" style={{ animationDelay: `${index * -.37}s` }} />)}
        </g>
        <path d="M191 219C211 232 249 232 269 219M174 264C202 283 258 283 286 264M137 369C192 389 268 389 323 369" stroke="currentColor" strokeWidth="1.1" strokeDasharray="3 6" opacity=".72" />
        <circle cx="196" cy="153" r="2.8" fill="#eaffff" /><circle cx="264" cy="153" r="2.8" fill="#eaffff" />
      </g>
      <g clipPath={`url(#${bodyClip})`} className={assembly || engaged ? "genome-scan-beam genome-scan-beam-active" : "genome-scan-beam"}>
        <rect x="100" y="-70" width="260" height="56" fill="currentColor" opacity=".1" />
        <path d="M100 0H360" stroke="#ecffff" strokeWidth="1.1" opacity=".85" />
      </g>
    </svg>
  </motion.button>;
}
