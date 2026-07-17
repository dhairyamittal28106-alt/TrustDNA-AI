export type AuthFailure = {
  ok: false;
  code: "AUTH_PROVIDER_NOT_CONFIGURED";
  message: string;
};

export type AuthProvider = {
  signIn(input: { email: string; password: string }): Promise<AuthFailure>;
  signUp(input: { email: string; password: string }): Promise<AuthFailure>;
  requestPasswordReset(input: { email: string }): Promise<AuthFailure>;
};

const unavailableMessage = "Authentication is not configured for this deployment. Connect Firebase, Clerk, or the TrustDNA auth service before enabling account actions.";

export const unconfiguredAuthProvider: AuthProvider = {
  async signIn() {
    return { ok: false, code: "AUTH_PROVIDER_NOT_CONFIGURED", message: unavailableMessage };
  },
  async signUp() {
    return { ok: false, code: "AUTH_PROVIDER_NOT_CONFIGURED", message: unavailableMessage };
  },
  async requestPasswordReset() {
    return { ok: false, code: "AUTH_PROVIDER_NOT_CONFIGURED", message: unavailableMessage };
  },
};

export function getAuthProvider(): AuthProvider {
  return unconfiguredAuthProvider;
}
