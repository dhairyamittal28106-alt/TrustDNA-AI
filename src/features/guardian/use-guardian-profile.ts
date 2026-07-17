"use client";

import { useCallback, useSyncExternalStore } from "react";
import { guardianProfileStore } from "@/features/guardian/guardian-profile-store";

const noSubscription = () => () => undefined;
const emptyProfile = () => null;

export function useGuardianProfile(userId: string | undefined, fallbackPhotoUrl: string | null | undefined): string | null {
  const read = useCallback(() => userId ? guardianProfileStore.load(userId) ?? fallbackPhotoUrl ?? null : fallbackPhotoUrl ?? null, [fallbackPhotoUrl, userId]);
  return useSyncExternalStore(noSubscription, read, emptyProfile);
}
