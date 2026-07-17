"use client";

import { useRouter } from "next/navigation";
import { LandingPage } from "@/components/landing-page";

export function PlatformLanding() {
  const router = useRouter();

  return <LandingPage onStart={() => router.push("/sign-up")} onTryDemo={() => router.push("/demo")} />;
}
