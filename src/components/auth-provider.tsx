"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { loadProfile, observeAuthState, signOut, type TrustDNAUser, type UserProfile } from "@/features/auth/provider";

type AuthContextValue = {
  user: TrustDNAUser | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TrustDNAUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribe = observeAuthState(async (firebaseUser) => {
      if (!active) return;
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      const nextProfile = await loadProfile(firebaseUser);
      if (!active) return;
      setUser({ uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName, photoURL: firebaseUser.photoURL });
      setProfile(nextProfile);
      setLoading(false);
    });

    if (!unsubscribe) {
      const timeout = window.setTimeout(() => { if (active) setLoading(false); }, 0);
      return () => { active = false; window.clearTimeout(timeout); };
    }
    return () => { active = false; unsubscribe?.(); };
  }, []);

  async function refreshProfile() {
    const services = await import("@/lib/firebase");
    const firebaseUser = services.getFirebaseServices()?.auth.currentUser;
    if (!firebaseUser) return null;
    const nextProfile = await loadProfile(firebaseUser);
    setProfile(nextProfile);
    return nextProfile;
  }

  async function logout() {
    await signOut();
  }

  return <AuthContext.Provider value={{ user, profile, loading, refreshProfile, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
