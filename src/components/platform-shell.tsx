"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, BrainCircuit, FileText, Fingerprint, LayoutDashboard, LogOut, Mail, Radar, ShieldAlert, ShieldCheck, SlidersHorizontal, UserRound, type LucideIcon } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { useAuth } from "@/components/auth-provider";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/genome", label: "Identity Genome", icon: Fingerprint },
  { href: "/gmail", label: "Gmail Source", icon: Mail },
  { href: "/twin", label: "Identity Twin", icon: BrainCircuit },
  { href: "/investigate", label: "New Investigation", icon: Radar },
  { href: "/investigations", label: "Investigations", icon: ShieldAlert },
  { href: "/cases", label: "Case Files", icon: FileText },
  { href: "/certificates", label: "Certificates", icon: BadgeCheck },
  { href: "/reports", label: "Evidence Reports", icon: FileText },
];

const accountNavigation = [
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal },
];

export function PlatformShell({ children, active }: { children: React.ReactNode; active: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  const displayName = user?.displayName || user?.email?.split("@")[0] || "TrustDNA member";

  return (
    <main className="app-backdrop min-h-screen">
      <div className="grid-overlay pointer-events-none fixed inset-0 opacity-50" />
      <div className="relative flex min-h-screen">
        <aside className="glass fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-white/[.08] px-4 py-5 lg:flex lg:flex-col"><Link href="/" aria-label="TrustDNA home"><BrandMark /></Link><p className="mt-12 px-3 font-mono text-[10px] tracking-[.16em] text-slate-600">PLATFORM</p><nav aria-label="Platform navigation" className="mt-3 space-y-1">{navigation.map(({ href, label, icon: Icon }) => <NavItem key={href} href={href} label={label} active={active === href.slice(1)} icon={Icon} />)}</nav><div className="mt-auto border-t border-white/[.08] pt-4"><p className="px-3 font-mono text-[10px] tracking-[.16em] text-slate-600">ACCOUNT</p><nav aria-label="Account navigation" className="mt-3 space-y-1">{accountNavigation.map(({ href, label, icon: Icon }) => <NavItem key={href} href={href} label={label} active={active === href.slice(1)} icon={Icon} />)}</nav><Link href="/demo" className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-[#aa9bff]/20 bg-[#8b78f6]/10 px-3 py-2.5 text-xs font-medium text-[#c3b9ff] transition hover:bg-[#8b78f6]/20"><ShieldCheck aria-hidden="true" className="size-4" />Try Judge Demo</Link></div></aside>
        <div className="min-w-0 flex-1 lg:pl-64"><header className="sticky top-0 z-10 border-b border-white/[.07] bg-[#090b22]/80 px-5 py-4 backdrop-blur-xl md:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4"><div className="lg:hidden"><Link href="/" aria-label="TrustDNA home"><BrandMark compact /></Link></div><nav aria-label="Mobile platform navigation" className="flex max-w-full items-center gap-1 overflow-x-auto lg:hidden">{navigation.slice(0, 5).map(({ href, label }) => <Link key={href} href={href} className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs ${active === href.slice(1) ? "bg-white/[.08] text-white" : "text-slate-500 hover:text-slate-200"}`}>{label}</Link>)}</nav><div className="ml-auto flex items-center gap-3"><div className="hidden text-right sm:block"><p className="max-w-36 truncate text-xs text-slate-200">{displayName}</p><p className="mt-0.5 font-mono text-[9px] tracking-[.12em] text-slate-600">IDENTITY PROTECTED</p></div><button type="button" onClick={handleLogout} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-slate-400 transition hover:bg-white/[.06] hover:text-white"><LogOut aria-hidden="true" className="size-3.5" /><span className="hidden sm:inline">Sign out</span></button></div></div></header>{children}</div>
      </div>
    </main>
  );
}

function NavItem({ href, label, active, icon: Icon }: { href: string; label: string; active: boolean; icon: LucideIcon }) {
  return <Link href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-[#8d7af7]/15 text-white shadow-inner shadow-white/[.03]" : "text-slate-400 hover:bg-white/[.04] hover:text-white"}`}><Icon aria-hidden="true" className={`size-4 ${active ? "text-[#c1b7ff]" : "text-slate-500"}`} />{label}</Link>;
}
