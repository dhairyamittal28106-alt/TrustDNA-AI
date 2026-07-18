import type { GmailSyncResult } from "@/features/gmail/types";
import { maskToken, tokenKind } from "@/features/gmail/token-diagnostics";

type ApiFailure = { code?: string; message?: string };

export class GmailSyncApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
  }
}

export async function syncGmail(input: { accessToken: string; genomeId?: string; displayName: string }): Promise<GmailSyncResult> {
  console.info("[trustdna:gmail] forwarding token to /api/gmail/sync", { tokenKind: tokenKind(input.accessToken), token: maskToken(input.accessToken), hasGenomeId: Boolean(input.genomeId) });
  const response = await fetch("/api/gmail/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as GmailSyncResult | ApiFailure | null;
  if (!response.ok) {
    const failure = body as ApiFailure | null;
    throw new GmailSyncApiError(failure?.message ?? "Gmail could not be synchronized right now.", response.status, failure?.code);
  }
  return body as GmailSyncResult;
}
