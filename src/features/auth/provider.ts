import { FirebaseError } from "firebase/app";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { requestTrustDnaGoogleScopes } from "@/features/gmail/google-oauth-scopes";
import { getFirebaseServices } from "@/lib/firebase";

export type TrustDNAUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export type UserProfile = TrustDNAUser & {
  onboardingCompleted: boolean;
  persisted: boolean;
};

export type AuthSuccess = {
  ok: true;
  user: TrustDNAUser;
  onboardingCompleted: boolean;
  verificationEmailSent: boolean;
};

export type AuthFailure = {
  ok: false;
  message: string;
};

export type AuthOutcome = AuthSuccess | AuthFailure;

function mapUser(user: User): TrustDNAUser {
  return { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL };
}

function friendlyAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    const messages: Record<string, string> = {
      "auth/invalid-credential": "Incorrect email or password.",
      "auth/wrong-password": "Incorrect email or password.",
      "auth/user-not-found": "Incorrect email or password.",
      "auth/email-already-in-use": "An account already exists with this email.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/weak-password": "Choose a stronger password with at least 8 characters.",
      "auth/network-request-failed": "Unable to connect. Please try again.",
      "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
      "auth/popup-closed-by-user": "Google sign-in was cancelled.",
      "auth/popup-blocked": "Your browser blocked the sign-in window. Please allow popups and try again.",
      "auth/account-exists-with-different-credential": "An account already exists with this email. Sign in using the method you used originally.",
    };
    return messages[error.code] ?? "We couldn’t complete that request. Please try again.";
  }
  return "We couldn’t complete that request. Please try again.";
}

async function persistSession() {
  const services = getFirebaseServices();
  if (!services) throw new Error("FIREBASE_UNAVAILABLE");
  await setPersistence(services.auth, browserLocalPersistence);
  return services;
}

async function ensureProfile(user: User): Promise<UserProfile> {
  const services = getFirebaseServices();
  const identity = mapUser(user);
  if (!services) return { ...identity, onboardingCompleted: false, persisted: false };

  try {
    const reference = doc(services.firestore, "users", user.uid);
    const snapshot = await getDoc(reference);
    if (!snapshot.exists()) {
      await setDoc(reference, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        onboardingCompleted: false,
      });
      return { ...identity, onboardingCompleted: false, persisted: true };
    }
    return { ...identity, onboardingCompleted: snapshot.data().onboardingCompleted === true, persisted: true };
  } catch {
    return { ...identity, onboardingCompleted: false, persisted: false };
  }
}

async function successFor(user: User, verificationEmailSent = false): Promise<AuthSuccess> {
  const profile = await ensureProfile(user);
  return { ok: true, user: mapUser(user), onboardingCompleted: profile.onboardingCompleted, verificationEmailSent };
}

export async function signUpWithEmail(input: { email: string; password: string }): Promise<AuthOutcome> {
  try {
    const { auth } = await persistSession();
    const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
    const verificationEmailSent = await sendEmailVerification(credential.user).then(() => true).catch(() => false);
    return successFor(credential.user, verificationEmailSent);
  } catch (error) {
    return { ok: false, message: friendlyAuthError(error) };
  }
}

export async function signInWithEmail(input: { email: string; password: string }): Promise<AuthOutcome> {
  try {
    const { auth } = await persistSession();
    const credential = await signInWithEmailAndPassword(auth, input.email, input.password);
    return successFor(credential.user);
  } catch (error) {
    return { ok: false, message: friendlyAuthError(error) };
  }
}

export async function signInWithGoogle(): Promise<AuthOutcome> {
  try {
    const { auth } = await persistSession();
    const provider = new GoogleAuthProvider();
    requestTrustDnaGoogleScopes(provider);
    provider.setCustomParameters({ prompt: "select_account consent", include_granted_scopes: "true" });
    const credential = await signInWithPopup(auth, provider);
    return successFor(credential.user);
  } catch (error) {
    return { ok: false, message: friendlyAuthError(error) };
  }
}

export async function requestPasswordReset(email: string): Promise<AuthFailure | { ok: true; message: string }> {
  try {
    const { auth } = await persistSession();
    await sendPasswordResetEmail(auth, email);
    return { ok: true, message: "If an account exists for that email, password reset instructions are on their way." };
  } catch (error) {
    return { ok: false, message: friendlyAuthError(error) };
  }
}

export async function markOnboardingComplete(user: TrustDNAUser): Promise<boolean> {
  const services = getFirebaseServices();
  if (!services) return false;
  try {
    await setDoc(doc(services.firestore, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      onboardingCompleted: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export async function signOut(): Promise<void> {
  const services = getFirebaseServices();
  if (services) await firebaseSignOut(services.auth);
}

export function observeAuthState(callback: (user: User | null) => void): (() => void) | null {
  const services = getFirebaseServices();
  if (!services) return null;
  return onAuthStateChanged(services.auth, callback);
}

export async function loadProfile(user: User): Promise<UserProfile> {
  return ensureProfile(user);
}
