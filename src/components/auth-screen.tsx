"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Fingerprint, KeyRound, Mail, ShieldCheck, UserRoundPlus, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { useAuth } from "@/components/auth-provider";
import { requestPasswordReset, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/features/auth/provider";

type AuthMode = "login" | "sign-up" | "forgot-password";
type Notice = { tone: "error" | "success"; message: string } | null;

const copy: Record<AuthMode, { eyebrow: string; title: string; body: string; submit: string }> = {
  login: { eyebrow: "WELCOME BACK", title: "Return to your trust layer.", body: "Sign in to manage your Identity Genome, investigations, and Guardian settings.", submit: "Sign in" },
  "sign-up": { eyebrow: "CREATE YOUR ACCOUNT", title: "Start with an Identity Genome.", body: "Build a transparent, evidence-backed foundation for your digital identity.", submit: "Create account" },
  "forgot-password": { eyebrow: "ACCOUNT RECOVERY", title: "Restore secure access.", body: "Enter your email and we’ll help you get back to your TrustDNA workspace.", submit: "Send recovery instructions" },
};

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const content = copy[mode];
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !user || mode === "forgot-password") return;
    router.replace(profile?.onboardingCompleted ? "/dashboard" : "/onboarding");
  }, [loading, mode, profile?.onboardingCompleted, router, user]);

  function destination(onboardingCompleted: boolean) {
    const requested = new URLSearchParams(window.location.search).get("next");
    if (onboardingCompleted && requested?.startsWith("/")) return requested;
    return onboardingCompleted ? "/dashboard" : "/onboarding";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    if (!email.includes("@")) {
      setNotice({ tone: "error", message: "Enter a valid email address." });
      return;
    }
    if (mode !== "forgot-password" && password.length < 8) {
      setNotice({ tone: "error", message: "Use at least 8 characters for your password." });
      return;
    }
    if (mode === "sign-up" && password !== confirmPassword) {
      setNotice({ tone: "error", message: "Passwords do not match." });
      return;
    }

    setSubmitting(true);
    if (mode === "forgot-password") {
      const outcome = await requestPasswordReset(email);
      setNotice({ tone: outcome.ok ? "success" : "error", message: outcome.message });
      setSubmitting(false);
      return;
    }

    const outcome = mode === "sign-up" ? await signUpWithEmail({ email, password }) : await signInWithEmail({ email, password });
    setSubmitting(false);
    if (!outcome.ok) {
      setNotice({ tone: "error", message: outcome.message });
      return;
    }
    router.replace(destination(outcome.onboardingCompleted));
  }

  async function handleGoogleSignIn() {
    setNotice(null);
    setSubmitting(true);
    const outcome = await signInWithGoogle();
    setSubmitting(false);
    if (!outcome.ok) {
      setNotice({ tone: "error", message: outcome.message });
      return;
    }
    router.replace(destination(outcome.onboardingCompleted));
  }

  return (
    <main className="app-backdrop min-h-screen px-5 py-5 md:px-10">
      <div className="grid-overlay pointer-events-none fixed inset-0 opacity-50" />
      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between"><Link href="/" aria-label="Back to TrustDNA landing page"><BrandMark /></Link><Link href="/demo" className="text-sm text-slate-400 transition hover:text-white">Try Judge Demo <ArrowRight className="ml-1 inline size-3.5" /></Link></header>
        <div className="my-auto grid gap-8 py-14 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <section className="hidden max-w-xl lg:block"><p className="text-xs font-medium tracking-[.2em] text-[#b6aaff]">{content.eyebrow}</p><h1 className="mt-5 text-5xl font-semibold tracking-[-.05em] text-white">{content.title}</h1><p className="mt-6 max-w-md text-base leading-7 text-slate-300">{content.body}</p><div className="mt-10 space-y-4 text-sm text-slate-400"><Feature icon={Fingerprint} text="Versioned, explainable Identity Genome" /><Feature icon={ShieldCheck} text="Evidence-led investigations, not opaque scores" /><Feature icon={KeyRound} text="Privacy and consent remain under your control" /></div></section>
          <section aria-labelledby="auth-title" className="glass mx-auto w-full max-w-md rounded-3xl border border-white/[.12] p-6 shadow-2xl shadow-black/30 md:p-8"><div className="flex size-11 items-center justify-center rounded-2xl bg-[#9280fb]/15 text-[#c0b5ff]">{mode === "forgot-password" ? <KeyRound aria-hidden="true" className="size-5" /> : mode === "sign-up" ? <UserRoundPlus aria-hidden="true" className="size-5" /> : <Fingerprint aria-hidden="true" className="size-5" />}</div><p className="mt-6 text-xs font-medium tracking-[.18em] text-[#b7adff]">{content.eyebrow}</p><h1 id="auth-title" className="mt-3 text-3xl font-semibold tracking-tight text-white">{content.title}</h1><p className="mt-3 text-sm leading-6 text-slate-400">{content.body}</p>
            <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate><label className="block"><span className="mb-2 block text-xs font-medium text-slate-300">Email address</span><span className="flex items-center gap-2 rounded-xl border border-white/[.1] bg-black/15 px-3 text-slate-500 focus-within:border-[#a99bff]/60"><Mail aria-hidden="true" className="size-4" /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" placeholder="you@company.com" required /></span></label>
              {mode !== "forgot-password" && <label className="block"><span className="mb-2 block text-xs font-medium text-slate-300">Password</span><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} className="h-11 w-full rounded-xl border border-white/[.1] bg-black/15 px-3 text-sm text-white outline-none transition focus:border-[#a99bff]/60" required /></label>}
              {mode === "sign-up" && <label className="block"><span className="mb-2 block text-xs font-medium text-slate-300">Confirm password</span><input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" className="h-11 w-full rounded-xl border border-white/[.1] bg-black/15 px-3 text-sm text-white outline-none transition focus:border-[#a99bff]/60" required /></label>}
              {mode === "login" && <Link className="block text-right text-xs text-[#b8adff] hover:text-white" href="/forgot-password">Forgot password?</Link>}
              {notice && <p role="status" className={`rounded-xl border px-3 py-3 text-xs leading-5 ${notice.tone === "success" ? "border-emerald-200/15 bg-emerald-300/[.07] text-emerald-100" : "border-red-200/15 bg-red-300/[.07] text-red-100"}`}>{notice.message}</p>}
              <Button disabled={submitting} className="h-12 w-full rounded-xl bg-[#8e7af6] text-white hover:bg-[#a08fff]">{submitting ? "Securing your session…" : content.submit}<ArrowRight className="size-4" /></Button>
            </form>
            {mode !== "forgot-password" && <><div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-white/[.08]" /><span className="font-mono text-[9px] tracking-[.13em] text-slate-600">OR CONTINUE WITH</span><span className="h-px flex-1 bg-white/[.08]" /></div><Button onClick={handleGoogleSignIn} disabled={submitting} variant="outline" className="h-11 w-full rounded-xl border-white/[.12] bg-white/[.03] text-slate-100 hover:bg-white/[.08] hover:text-white"><span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-white text-[11px] font-semibold text-[#4285f4]">G</span>Continue with Google</Button></>}
            <p className="mt-6 text-center text-xs text-slate-500">{mode === "login" ? <>New to TrustDNA? <Link className="text-[#b8adff] hover:text-white" href="/sign-up">Create an account</Link></> : mode === "sign-up" ? <>Already have an account? <Link className="text-[#b8adff] hover:text-white" href="/login">Sign in</Link></> : <Link className="text-[#b8adff] hover:text-white" href="/login">Back to sign in</Link>}</p>
          </section>
        </div>
      </div>
    </main>
  );
}

function Feature({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return <p className="flex items-center gap-3"><Icon aria-hidden="true" className="size-4 text-[#b7adff]" />{text}</p>;
}
