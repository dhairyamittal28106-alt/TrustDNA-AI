import { NextResponse } from "next/server";

type LiveInvestigationRequest = {
  content: string;
  sourceLabel: string;
  displayName: string;
  genomeId?: string;
};

type ApiError = { message?: string };

const apiBaseUrl = process.env.TRUSTDNA_API_BASE_URL ?? "http://127.0.0.1:8000";

async function apiFetch<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(error?.message ?? `TrustDNA API returned ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function streamEvent(controller: ReadableStreamDefaultController<Uint8Array>, type: string, data: unknown) {
  controller.enqueue(new TextEncoder().encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`));
}

/**
 * Streams only milestones that have actually completed at the FastAPI layer.
 * The uploaded text is forwarded for analysis but is never persisted by this BFF.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LiveInvestigationRequest | null;
  const content = body?.content?.trim();
  const sourceLabel = body?.sourceLabel?.trim();
  const displayName = body?.displayName?.trim();

  if (!content || content.length < 20 || content.length > 120_000 || !sourceLabel || !displayName) {
    return NextResponse.json({ message: "Provide 20–120,000 characters of evidence and a source label." }, { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        streamEvent(controller, "evidence_validated", { sourceLabel, characterCount: content.length });

        let genomeId = body?.genomeId;
        let genome: { id: string; owner_id: string; display_name: string };
        if (!genomeId) {
          genome = await apiFetch<{ id: string; owner_id: string; display_name: string }>("/api/v1/identity-genomes", {
            method: "POST",
            body: JSON.stringify({ owner_id: crypto.randomUUID(), display_name: displayName }),
          });
          genomeId = genome.id;
          streamEvent(controller, "genome_created", { genomeId });
        } else {
          genome = await apiFetch<{ id: string; owner_id: string; display_name: string }>(`/api/v1/identity-genomes/${genomeId}`, { method: "GET" });
        }

        const profile = await apiFetch(`/api/v1/identity-genomes/${genomeId}/samples/text`, {
          method: "POST",
          body: JSON.stringify({ content, source_label: sourceLabel }),
        });
        streamEvent(controller, "artifact_processed", { genomeId });
        const versions = await apiFetch(`/api/v1/identity-genomes/${genomeId}/versions`, { method: "GET" });
        streamEvent(controller, "genome_updated", {
          genome,
          profile,
          versions,
        });

        const investigation = await apiFetch<{ id: string }>("/api/v1/investigations", {
          method: "POST",
          body: JSON.stringify({
            identity_genome_id: genomeId,
            artifact_type: "plain_text",
            artifact_reference: `consented://${sourceLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "evidence"}`,
          }),
        });
        streamEvent(controller, "case_created", { investigationId: investigation.id });
        streamEvent(controller, "agents_dispatched", { investigationId: investigation.id });

        const result = await apiFetch(`/api/v1/investigations/${investigation.id}/run-text`, {
          method: "POST",
          body: JSON.stringify({ content }),
        });
        streamEvent(controller, "investigation_completed", { result });
      } catch (error) {
        streamEvent(controller, "error", { message: error instanceof Error ? error.message : "Unable to complete the live investigation." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
    },
  });
}
