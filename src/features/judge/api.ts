import type { InvestigationResult, Scenario } from "@/features/judge/types";

export async function runJudgeScenario(scenario: Scenario): Promise<InvestigationResult> {
  const response = await fetch("/api/judge-demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scenario),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message ?? "The investigation could not be completed.");
  }

  return response.json() as Promise<InvestigationResult>;
}
