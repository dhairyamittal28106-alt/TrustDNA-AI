"use client";

import { FirebaseError } from "firebase/app";
import { getAdditionalUserInfo, GoogleAuthProvider, linkWithPopup, reauthenticateWithPopup } from "firebase/auth";
import { gmailReadOnlyScope, requestTrustDnaGoogleScopes } from "@/features/gmail/google-oauth-scopes";
import { getFirebaseServices } from "@/lib/firebase";
import { maskToken, tokenKind } from "@/features/gmail/token-diagnostics";
import type { GmailAuthorization } from "@/features/gmail/types";

export { gmailReadOnlyScope };

export class GmailConnectorError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
  }
}

export class GmailConnector {
  isAvailable(): boolean {
    return Boolean(getFirebaseServices()?.auth.currentUser);
  }

  async authorizeReadOnly(): Promise<GmailAuthorization> {
    const services = getFirebaseServices();
    const user = services?.auth.currentUser;
    if (!services || !user) throw new GmailConnectorError("Gmail connection is unavailable until Firebase Authentication is configured and you are signed in.", "GMAIL_AUTH_UNAVAILABLE");

    try {
      const provider = new GoogleAuthProvider();
      requestTrustDnaGoogleScopes(provider);
      provider.setCustomParameters({ prompt: "consent", include_granted_scopes: "true" });
      const hasGoogleProvider = user.providerData.some((providerData) => providerData.providerId === "google.com");
      const result = hasGoogleProvider
        ? await reauthenticateWithPopup(user, provider)
        : await linkWithPopup(user, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      console.info("[trustdna:gmail] oauth popup completed", {
        flow: hasGoogleProvider ? "reauthenticate" : "link",
        providerId: credential?.providerId ?? null,
        hasAccessToken: Boolean(credential?.accessToken),
        hasIdToken: Boolean(credential?.idToken),
      });
      if (!credential?.accessToken) throw new GmailConnectorError("Google did not return a Gmail access token. Please try connecting again.", "GMAIL_TOKEN_MISSING");
      console.info("[trustdna:gmail] oauth credential token", { tokenKind: tokenKind(credential.accessToken), token: maskToken(credential.accessToken) });
      const scopes = await assertGmailReadOnlyScope(credential.accessToken);
      console.info("[trustdna:gmail] granted oauth scopes", { scopes, gmailReadOnlyGranted: scopes.includes(gmailReadOnlyScope) });
      const profile = getAdditionalUserInfo(result)?.profile;
      const connectedEmail = profile && typeof profile.email === "string" ? profile.email : result.user.email;
      if (!connectedEmail) throw new GmailConnectorError("Google did not return an email address for this connection.", "GMAIL_EMAIL_MISSING");
      return { accessToken: credential.accessToken, email: connectedEmail };
    } catch (error) {
      throw new GmailConnectorError(friendlyGmailAuthError(error), error instanceof FirebaseError ? error.code : undefined);
    }
  }

  /**
   * Returns only a transient, consented sent-message text batch so the existing
   * structured-knowledge pipeline can process direct statements. Callers must
   * never persist the returned text or the OAuth token.
   */
  async readSentMessageText(accessToken: string, maxMessages: number): Promise<string> {
    const limit = Math.min(Math.max(maxMessages, 1), 100);
    const query = new URLSearchParams({ maxResults: `${limit}`, q: "in:sent" });
    const listed = await gmailRequest<GmailListResponse>(`/users/me/messages?${query.toString()}`, accessToken);
    const messages = await Promise.all((listed.messages ?? []).map(async ({ id }) => {
      const message = await gmailRequest<GmailMessageResponse>(`/users/me/messages/${encodeURIComponent(id)}?format=full`, accessToken);
      return extractPlainText(message.payload);
    }));
    return messages.map(normalizeMessage).filter(Boolean).join("\n\n");
  }
}

type GmailListResponse = { messages?: Array<{ id: string }> };
type GmailPayload = { mimeType?: string; body?: { data?: string }; parts?: GmailPayload[] };
type GmailMessageResponse = { payload?: GmailPayload };

async function gmailRequest<T>(path: string, accessToken: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    throw new GmailConnectorError("Gmail message content could not be read for structured fact extraction.", "GMAIL_CONTENT_UNAVAILABLE");
  }
  if (!response.ok) throw new GmailConnectorError("Gmail message content could not be read for structured fact extraction.", "GMAIL_CONTENT_UNAVAILABLE");
  return response.json() as Promise<T>;
}

function extractPlainText(payload: GmailPayload | undefined): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) return decodeBase64Url(payload.body.data);
  return (payload.parts ?? []).map(extractPlainText).filter(Boolean).join("\n");
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const bytes = Uint8Array.from(window.atob(padded), (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function normalizeMessage(value: string): string {
  return value
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith(">"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function assertGmailReadOnlyScope(accessToken: string): Promise<string[]> {
  let payload: unknown;
  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`, { cache: "no-store" });
    payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error("TOKEN_INFO_UNAVAILABLE");
  } catch {
    throw new GmailConnectorError("Gmail permission needs to be re-authorized.", "GMAIL_SCOPE_MISSING");
  }

  const scope = payload && typeof payload === "object" && "scope" in payload && typeof payload.scope === "string" ? payload.scope : "";
  const scopes = scope.split(/\s+/).filter(Boolean);
  if (!scopes.includes(gmailReadOnlyScope)) {
    throw new GmailConnectorError("Gmail permission needs to be re-authorized.", "GMAIL_SCOPE_MISSING");
  }
  return scopes;
}

function friendlyGmailAuthError(error: unknown): string {
  if (error instanceof GmailConnectorError) return error.message;
  if (error instanceof FirebaseError) {
    const messages: Record<string, string> = {
      "auth/popup-closed-by-user": "Gmail connection was cancelled.",
      "auth/popup-blocked": "Your browser blocked the Google consent window. Allow popups and try again.",
      "auth/credential-already-in-use": "This Google account is already linked to another TrustDNA account.",
      "auth/requires-recent-login": "Please sign in again before connecting Gmail.",
      "auth/network-request-failed": "Unable to reach Google. Please check your connection and try again.",
    };
    return messages[error.code] ?? "We couldn’t complete the Gmail consent request. Please try again.";
  }
  return "We couldn’t complete the Gmail consent request. Please try again.";
}
