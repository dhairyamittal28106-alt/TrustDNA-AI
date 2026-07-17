import { NextResponse } from "next/server";
import type {
  IdentityGenomeResponse,
  IdentityGenomeVersionResponse,
  IdentityProfileResponse,
  IntelligenceApiPayload,
} from "@/features/identity-intelligence/types";

export const dynamic = "force-dynamic";

type BackendError = { code?: string; message?: string };

class BackendRequestError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
  }
}

function getApiBaseUrl(): string {
  return process.env.TRUSTDNA_API_BASE_URL ?? "http://127.0.0.1:8000";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as T | BackendError | null;
  if (!response.ok) {
    const error = payload as BackendError | null;
    throw new BackendRequestError(error?.message ?? "The secure analysis service could not complete this request.", response.status, error?.code);
  }
  return payload as T;
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: Request) {
  const genomeId = new URL(request.url).searchParams.get("genomeId");
  if (!genomeId || !isUuid(genomeId)) return errorResponse("GENOME_ID_REQUIRED", "A valid Identity Genome reference is required.", 400);

  try {
    const [genome, versions] = await Promise.all([
      apiFetch<IdentityGenomeResponse>(`/api/v1/identity-genomes/${encodeURIComponent(genomeId)}`),
      apiFetch<IdentityGenomeVersionResponse[]>(`/api/v1/identity-genomes/${encodeURIComponent(genomeId)}/versions`),
    ]);
    return NextResponse.json({ genome, versions } satisfies IntelligenceApiPayload);
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_REQUEST", "Please provide a valid text source.", 400);
  }

  if (!isRecord(body)) return errorResponse("INVALID_REQUEST", "Please provide a valid text source.", 400);
  const content = stringValue(body.content)?.trim();
  const sourceLabel = stringValue(body.sourceLabel)?.trim();
  const displayName = stringValue(body.displayName)?.trim();
  const providedGenomeId = stringValue(body.genomeId)?.trim();

  if (!content || content.length < 20) return errorResponse("SOURCE_TOO_SHORT", "Add at least 20 characters so TrustDNA can analyze a meaningful text source.", 400);
  if (content.length > 500_000) return errorResponse("SOURCE_TOO_LARGE", "This text source is too large for a single analysis. Please use a smaller excerpt.", 400);
  if (!sourceLabel || sourceLabel.length > 120) return errorResponse("SOURCE_LABEL_INVALID", "Choose a concise label for this source.", 400);
  if (!displayName || displayName.length > 120) return errorResponse("DISPLAY_NAME_INVALID", "A valid identity name is required.", 400);
  if (providedGenomeId && !isUuid(providedGenomeId)) return errorResponse("GENOME_ID_INVALID", "The saved Identity Genome reference is not valid. Start a fresh analysis to continue.", 400);

  try {
    const genome = providedGenomeId
      ? await apiFetch<IdentityGenomeResponse>(`/api/v1/identity-genomes/${encodeURIComponent(providedGenomeId)}`)
      : await apiFetch<IdentityGenomeResponse>("/api/v1/identity-genomes", {
        method: "POST",
        body: JSON.stringify({ owner_id: crypto.randomUUID(), display_name: displayName }),
      });

    const profile = await apiFetch<IdentityProfileResponse>(`/api/v1/identity-genomes/${genome.id}/samples/text`, {
      method: "POST",
      body: JSON.stringify({ content, source_label: sourceLabel }),
    });
    const versions = await apiFetch<IdentityGenomeVersionResponse[]>(`/api/v1/identity-genomes/${genome.id}/versions`);
    return NextResponse.json({ genome, profile, versions } satisfies IntelligenceApiPayload, { status: 201 });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

function backendErrorResponse(error: unknown) {
  if (error instanceof BackendRequestError) {
    if (error.status === 404) return errorResponse(error.code ?? "IDENTITY_GENOME_NOT_FOUND", "That analysis session is no longer available. Add a new text source to continue.", 404);
    return errorResponse(error.code ?? "ANALYSIS_UNAVAILABLE", error.message, error.status >= 400 && error.status < 600 ? error.status : 502);
  }
  return errorResponse("ANALYSIS_UNAVAILABLE", "We couldn’t reach the secure analysis service. Please try again.", 502);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
