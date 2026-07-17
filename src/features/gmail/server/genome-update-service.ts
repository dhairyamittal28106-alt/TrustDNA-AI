import "server-only";

import type { IdentityGenomeResponse, IdentityGenomeVersionResponse, IdentityProfileResponse, IntelligenceApiPayload } from "@/features/identity-intelligence/types";

type BackendFailure = { code?: string; message?: string };

export class GenomeUpdateError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
  }
}

export class GenomeUpdateService {
  async update(input: { genomeId?: string; displayName: string; content: string; sourceLabel: string }): Promise<IntelligenceApiPayload> {
    const genome = input.genomeId
      ? await this.request<IdentityGenomeResponse>(`/api/v1/identity-genomes/${encodeURIComponent(input.genomeId)}`)
      : await this.request<IdentityGenomeResponse>("/api/v1/identity-genomes", {
        method: "POST",
        body: JSON.stringify({ owner_id: crypto.randomUUID(), display_name: input.displayName }),
      });
    const profile = await this.request<IdentityProfileResponse>(`/api/v1/identity-genomes/${encodeURIComponent(genome.id)}/samples/text`, {
      method: "POST",
      body: JSON.stringify({ content: input.content, source_label: input.sourceLabel }),
    });
    const versions = await this.request<IdentityGenomeVersionResponse[]>(`/api/v1/identity-genomes/${encodeURIComponent(genome.id)}/versions`);
    return { genome, profile, versions };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl()}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as T | BackendFailure | null;
    if (!response.ok) {
      const failure = payload as BackendFailure | null;
      throw new GenomeUpdateError(failure?.message ?? "The Identity Genome could not be updated.", response.status, failure?.code);
    }
    return payload as T;
  }

  private apiBaseUrl(): string {
    return process.env.TRUSTDNA_API_BASE_URL ?? "http://127.0.0.1:8000";
  }
}
