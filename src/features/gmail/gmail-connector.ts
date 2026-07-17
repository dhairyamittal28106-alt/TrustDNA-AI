"use client";

import { FirebaseError } from "firebase/app";
import { getAdditionalUserInfo, GoogleAuthProvider, linkWithPopup, reauthenticateWithPopup } from "firebase/auth";
import { gmailReadOnlyScope, requestTrustDnaGoogleScopes } from "@/features/gmail/google-oauth-scopes";
import { getFirebaseServices } from "@/lib/firebase";
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
      if (!credential?.accessToken) throw new GmailConnectorError("Google did not return a Gmail access token. Please try connecting again.", "GMAIL_TOKEN_MISSING");
      await assertGmailReadOnlyScope(credential.accessToken);
      const profile = getAdditionalUserInfo(result)?.profile;
      const connectedEmail = profile && typeof profile.email === "string" ? profile.email : result.user.email;
      if (!connectedEmail) throw new GmailConnectorError("Google did not return an email address for this connection.", "GMAIL_EMAIL_MISSING");
      return { accessToken: credential.accessToken, email: connectedEmail };
    } catch (error) {
      throw new GmailConnectorError(friendlyGmailAuthError(error), error instanceof FirebaseError ? error.code : undefined);
    }
  }
}

async function assertGmailReadOnlyScope(accessToken: string): Promise<void> {
  let payload: unknown;
  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`, { cache: "no-store" });
    payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error("TOKEN_INFO_UNAVAILABLE");
  } catch {
    throw new GmailConnectorError("Gmail permission needs to be re-authorized.", "GMAIL_SCOPE_MISSING");
  }

  const scope = payload && typeof payload === "object" && "scope" in payload && typeof payload.scope === "string" ? payload.scope : "";
  if (!scope.split(/\s+/).includes(gmailReadOnlyScope)) {
    throw new GmailConnectorError("Gmail permission needs to be re-authorized.", "GMAIL_SCOPE_MISSING");
  }
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
