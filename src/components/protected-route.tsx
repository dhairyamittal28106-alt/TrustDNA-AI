"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const onboardingRequired = Boolean(user && profile && !profile.onboardingCompleted);
  const onboardingComplete = Boolean(user && profile?.onboardingCompleted);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (pathname !== "/onboarding" && onboardingRequired) router.replace("/onboarding");
    if (pathname === "/onboarding" && onboardingComplete) router.replace("/dashboard");
  }, [loading, onboardingComplete, onboardingRequired, pathname, router, user]);

  if (loading || !user || (pathname !== "/onboarding" && onboardingRequired) || (pathname === "/onboarding" && onboardingComplete)) {
    return <main className="app-backdrop grid min-h-screen place-items-center px-5"><div className="text-center"><ShieldCheck aria-hidden="true" className="mx-auto size-6 animate-pulse text-[#b8adff]" /><p className="mt-4 text-sm text-slate-400">Securing your workspace…</p></div></main>;
  }

  return <>{children}</>;
}
