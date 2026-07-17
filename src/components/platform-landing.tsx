"use client";

import { useRouter } from "next/navigation";
import { LandingPage } from "@/components/landing-page";

export function PlatformLanding() {
  const router = useRouter();

  return <LandingPage onStart={() => router.push("/auth/sign-up")} onTryDemo={() => router.push("/demo")} />;
}
