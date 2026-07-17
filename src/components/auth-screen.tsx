"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Fingerprint, KeyRound, Mail, ShieldCheck, UserRoundPlus, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { getAuthProvider } from "@/features/auth/provider";

type AuthMode = "login" | "sign-up" | "forgot-password";

const copy: Record<AuthMode, { eyebrow: string; title: string; body: string; submit: string }> = {
  login: { eyebrow: "WELCOME BACK", title: "Return to your trust layer.", body: "Sign in to manage your Identity Genome, investigations, and Guardian settings.", submit: "Sign in" },
  "sign-up": { eyebrow: "CREATE YOUR ACCOUNT", title: "Start with an Identity Genome.", body: "Build a transparent, evidence-backed foundation for your digital identity.", submit: "Create account" },
  "forgot-password": { eyebrow: "ACCOUNT RECOVERY", title: "Restore secure access.", body: "We will send recovery instructions when an authentication provider is connected.", submit: "Send recovery instructions" },
};

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const content = copy[mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!email.includes("@")) {
      setMessage("Enter a valid email address.");
      return;
    }
    if (mode !== "forgot-password" && password.length < 8) {
      setMessage("Use at least 8 characters for your password.");
      return;
    }
    if (mode === "sign-up" && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const auth = getAuthProvider();
    const outcome = mode === "login"
      ? await auth.signIn({ email, password })
      : mode === "sign-up"
        ? await auth.signUp({ email, password })
        : await auth.requestPasswordReset({ email });
    setMessage(outcome.message);
    setSubmitting(false);
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
              {mode === "login" && <Link className="block text-right text-xs text-[#b8adff] hover:text-white" href="/auth/forgot-password">Forgot password?</Link>}
              {message && <p role="status" className="rounded-xl border border-amber-200/15 bg-amber-300/[.07] px-3 py-3 text-xs leading-5 text-amber-100">{message}</p>}
              <Button disabled={submitting} className="h-12 w-full rounded-xl bg-[#8e7af6] text-white hover:bg-[#a08fff]">{submitting ? "Checking configuration…" : content.submit}<ArrowRight className="size-4" /></Button>
            </form>
            <div className="mt-6 border-t border-white/[.08] pt-5 text-center text-xs leading-5 text-slate-500"><p>Authentication is intentionally unavailable in this build—no account action is simulated.</p><Link className="mt-2 inline-block text-[#b8adff] hover:text-white" href={mode === "sign-up" ? "/onboarding" : "/dashboard"}>{mode === "sign-up" ? "Open Identity Genome preview" : "Open unauthenticated platform preview"}</Link></div>
            <p className="mt-4 text-center text-xs text-slate-500">{mode === "login" ? <>New to TrustDNA? <Link className="text-[#b8adff] hover:text-white" href="/auth/sign-up">Create an account</Link></> : mode === "sign-up" ? <>Already have an account? <Link className="text-[#b8adff] hover:text-white" href="/auth/login">Sign in</Link></> : <Link className="text-[#b8adff] hover:text-white" href="/auth/login">Back to sign in</Link>}</p>
          </section>
        </div>
      </div>
    </main>
  );
}

function Feature({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return <p className="flex items-center gap-3"><Icon aria-hidden="true" className="size-4 text-[#b7adff]" />{text}</p>;
}
