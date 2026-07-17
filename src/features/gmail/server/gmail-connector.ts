import "server-only";

export type GmailMessage = {
  id: string;
  body: string;
};

type GmailListResponse = { messages?: Array<{ id: string }> };
type GmailPayload = { mimeType?: string; body?: { data?: string }; parts?: GmailPayload[] };
type GmailMessageResponse = { id: string; payload?: GmailPayload };

export class GmailApiError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) {
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
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) throw await gmailError(response);
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

async function gmailError(response: Response): Promise<GmailApiError> {
  if (response.status === 401) return new GmailApiError("Your Gmail permission has expired. Reconnect Gmail and try again.", 401, "GMAIL_AUTH_EXPIRED");
  if (response.status === 403) return new GmailApiError("Gmail read-only permission was not granted, or the Gmail API is not enabled for this Firebase project.", 403, "GMAIL_PERMISSION_DENIED");
  if (response.status === 429) return new GmailApiError("Gmail is temporarily rate-limiting requests. Please try again in a moment.", 429, "GMAIL_RATE_LIMITED");
  return new GmailApiError("Gmail could not retrieve sent messages right now.", response.status, "GMAIL_UNAVAILABLE");
}
