import { Fingerprint } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#9e85ff] to-[#4cbdf8] shadow-lg shadow-violet-500/20">
        <Fingerprint className="size-5 text-white" />
      </div>
      {!compact && <span className="text-lg font-semibold tracking-tight">Trust<span className="text-[#a493ff]">DNA</span><span className="text-slate-400">.ai</span></span>}
    </div>
  );
}
