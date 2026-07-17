import type { GoogleAuthProvider } from "firebase/auth";

export const gmailReadOnlyScope = "https://www.googleapis.com/auth/gmail.readonly";
export const googleIdentityScopes = ["openid", "email", "profile"] as const;

/** Requests the complete TrustDNA Google consent boundary on every OAuth flow. */
export function requestTrustDnaGoogleScopes(provider: GoogleAuthProvider): void {
  googleIdentityScopes.forEach((scope) => provider.addScope(scope));
  provider.addScope(gmailReadOnlyScope);
}
