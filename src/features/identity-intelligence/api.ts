import type { IntelligenceApiPayload } from "@/features/identity-intelligence/types";

type ApiFailure = { code?: string; message?: string };

export class IntelligenceApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as T | ApiFailure | null;
  if (!response.ok) {
    const failure = body as ApiFailure | null;
    throw new IntelligenceApiError(failure?.message ?? "We couldn’t complete the secure analysis. Please try again.", response.status, failure?.code);
  }
  return body as T;
}

export function loadGenomeIntelligence(genomeId: string): Promise<IntelligenceApiPayload> {
  return request<IntelligenceApiPayload>(`/api/identity-intelligence?genomeId=${encodeURIComponent(genomeId)}`);
}

export function ingestTextIntelligence(input: {
  genomeId?: string;
  displayName: string;
  content: string;
  sourceLabel: string;
}): Promise<IntelligenceApiPayload> {
  return request<IntelligenceApiPayload>("/api/identity-intelligence", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
