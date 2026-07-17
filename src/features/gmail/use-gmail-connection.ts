"use client";

import { useCallback, useSyncExternalStore } from "react";
import { gmailConnectionStore } from "@/features/gmail/session";
import type { GmailConnectionRecord } from "@/features/gmail/types";

const subscribeToNothing = () => () => undefined;
const emptyConnection = (): GmailConnectionRecord | null => null;

/** Hydration-safe Gmail connection metadata; email bodies and OAuth tokens are never exposed here. */
export function useGmailConnection(userId: string | undefined): GmailConnectionRecord | null {
  const subscribe = useCallback((onStoreChange: () => void) => gmailConnectionStore.subscribe(userId, onStoreChange), [userId]);
  const getSnapshot = useCallback(() => gmailConnectionStore.snapshot(userId), [userId]);
  return useSyncExternalStore(userId ? subscribe : subscribeToNothing, userId ? getSnapshot : emptyConnection, emptyConnection);
}
