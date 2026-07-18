import "server-only";

import { maskToken, tokenKind } from "@/features/gmail/token-diagnostics";

export type GmailMessage = {
  id: string;
  body: string;
};

type GmailListResponse = { messages?: Array<{ id: string }> };
type GmailPayload = { mimeType?: string; body?: { data?: string }; parts?: GmailPayload[] };
type GmailMessageResponse = { id: string; payload?: GmailPayload };
type GmailErrorPayload = { error?: { code?: number; message?: string; status?: string; errors?: Array<{ domain?: string; reason?: string; message?: string }> } };

export class GmailApiError extends Error {
  constructor(message: string, readonly status: number, readonly code: string, readonly diagnostics: Record<string, unknown>) {
    super(message);
  }
}

export class GmailConnector {
  async listSentMessages(accessToken: string, maxMessages: number): Promise<GmailMessage[]> {
    const query = new URLSearchParams({ maxResults: `${maxMessages}`, q: "in:sent" });
    const list = await this.request<GmailListResponse>(`/users/me/messages?${query.toString()}`, accessToken);
    const messages: GmailMessage[] = [];
    for (const item of list.messages ?? []) {
      const message = await this.request<GmailMessageResponse>(`/users/me/messages/${encodeURIComponent(item.id)}?format=full`, accessToken);
      const body = extractPlainText(message.payload);
      if (body.trim()) messages.push({ id: message.id, body });
    }
    return messages;
  }

  private async request<T>(path: string, accessToken: string): Promise<T> {
    console.info("[trustdna:gmail] gmail api request", { path, tokenKind: tokenKind(accessToken), token: maskToken(accessToken) });
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) throw await gmailError(response, path);
    console.info("[trustdna:gmail] gmail api response", { path, status: response.status });
    return response.json() as Promise<T>;
  }
}

function extractPlainText(payload: GmailPayload | undefined): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) return decodeBase64Url(payload.body.data);
  return (payload.parts ?? []).map(extractPlainText).filter(Boolean).join("\n");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

async function gmailError(response: Response, path: string): Promise<GmailApiError> {
  const raw = await response.text();
  const payload = parseGmailError(raw);
  const reason = payload?.error?.errors?.[0]?.reason;
  const googleStatus = payload?.error?.status;
  const diagnostics = { path, status: response.status, reason: reason ?? null, googleStatus: googleStatus ?? null, rawResponse: raw.slice(0, 2000) };
  const message = payload?.error?.message;

  if (response.status === 401) return new GmailApiError("Your Gmail authorization token is invalid or expired. Reconnect Gmail and try again.", 401, "GMAIL_AUTH_EXPIRED", diagnostics);
  if (response.status === 403 && ["accessNotConfigured", "serviceDisabled"].includes(reason ?? "")) return new GmailApiError("The Gmail API is not enabled for the Google Cloud project serving this OAuth client.", 403, "GMAIL_API_NOT_ENABLED", diagnostics);
  if ((response.status === 403 && ["dailyLimitExceeded", "rateLimitExceeded", "userRateLimitExceeded"].includes(reason ?? "")) || response.status === 429) return new GmailApiError("Gmail is temporarily rate-limiting requests. Please try again in a moment.", 429, "GMAIL_RATE_LIMITED", diagnostics);
  if (response.status === 403 && ["insufficientPermissions", "forbidden"].includes(reason ?? "")) return new GmailApiError("Gmail rejected this OAuth token for the requested mailbox operation.", 403, "GMAIL_PERMISSION_DENIED", diagnostics);
  if (response.status === 403) return new GmailApiError(`Gmail rejected the request${reason ? ` (${reason})` : ""}.`, 403, "GMAIL_ACCESS_FORBIDDEN", diagnostics);
  return new GmailApiError(message ?? "Gmail could not retrieve sent messages right now.", response.status, "GMAIL_UNAVAILABLE", diagnostics);
}

function parseGmailError(value: string): GmailErrorPayload | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" ? parsed as GmailErrorPayload : null;
  } catch {
    return null;
  }
}
