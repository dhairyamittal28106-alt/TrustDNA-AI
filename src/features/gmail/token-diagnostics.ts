export function maskToken(token: string): string {
  if (token.length <= 12) return `${token.slice(0, 3)}…`;
  return `${token.slice(0, 6)}…${token.slice(-4)} (length ${token.length})`;
}

export function tokenKind(token: string): "google_oauth_access_token" | "jwt_like_token" | "opaque_token" {
  if (token.startsWith("ya29.")) return "google_oauth_access_token";
  if (token.split(".").length === 3) return "jwt_like_token";
  return "opaque_token";
}
