import { NextResponse } from "next/server";

type DemoRequest = {
  title: string;
  artifactReference: string;
  candidateText: string;
  seedText: string;
};

const apiBaseUrl = process.env.TRUSTDNA_API_BASE_URL ?? "http://127.0.0.1:8000";

async function apiFetch<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message ?? `TrustDNA API returned ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function POST(request: Request) {
  try {
    const scenario = (await request.json()) as DemoRequest;
    if (!scenario.title || !scenario.artifactReference || !scenario.seedText || !scenario.candidateText) {
      return NextResponse.json({ message: "A complete Judge Mode scenario is required." }, { status: 400 });
    }

    const ownerId = crypto.randomUUID();
    const genome = await apiFetch<{ id: string }>("/api/v1/identity-genomes", {
      method: "POST",
      body: JSON.stringify({ owner_id: ownerId, display_name: "Judge Demo Identity" }),
    });

    await apiFetch(`/api/v1/identity-genomes/${genome.id}/samples/text`, {
      method: "POST",
      body: JSON.stringify({ content: scenario.seedText, source_label: "verified-writing-sample" }),
    });

    const investigation = await apiFetch<{ id: string }>("/api/v1/investigations", {
      method: "POST",
      body: JSON.stringify({
        identity_genome_id: genome.id,
        artifact_type: "plain_text",
        artifact_reference: scenario.artifactReference,
      }),
    });

    const result = await apiFetch(`/api/v1/investigations/${investigation.id}/run-text`, {
      method: "POST",
      body: JSON.stringify({ content: scenario.candidateText }),
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach the TrustDNA API.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
