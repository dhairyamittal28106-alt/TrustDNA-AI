import { NextResponse } from "next/server";
import { GmailSyncService } from "@/features/gmail/server/gmail-sync-service";
import { GmailApiError } from "@/features/gmail/server/gmail-connector";
import { GenomeUpdateError } from "@/features/gmail/server/genome-update-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const gmailSyncService = new GmailSyncService();

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_GMAIL_SYNC_REQUEST", "Please reconnect Gmail and try again.", 400);
  }
  if (!isRecord(body)) return errorResponse("INVALID_GMAIL_SYNC_REQUEST", "Please reconnect Gmail and try again.", 400);

  const accessToken = stringValue(body.accessToken);
  const displayName = stringValue(body.displayName)?.trim();
  const genomeId = stringValue(body.genomeId)?.trim();
  if (!accessToken || accessToken.length < 20) return errorResponse("GMAIL_TOKEN_REQUIRED", "Gmail authorization is required before a sync can start.", 401);
  if (!displayName || displayName.length > 120) return errorResponse("DISPLAY_NAME_INVALID", "A valid identity name is required before Gmail can update your Genome.", 400);
  if (genomeId && !isUuid(genomeId)) return errorResponse("GENOME_ID_INVALID", "The saved Identity Genome reference is not valid. Rebuild your Genome before syncing Gmail.", 400);

  try {
    const result = await gmailSyncService.sync({ accessToken, genomeId, displayName });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof GmailApiError) return errorResponse(error.code, error.message, error.status);
    if (error instanceof GenomeUpdateError) return errorResponse(error.code ?? "GENOME_UPDATE_FAILED", error.message, error.status >= 400 && error.status < 600 ? error.status : 502);
    return errorResponse("GMAIL_SYNC_UNAVAILABLE", "Gmail could not be synchronized right now. No Genome update was created.", 502);
  }
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
