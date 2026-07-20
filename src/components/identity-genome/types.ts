import type { LucideIcon } from "lucide-react";
import type { GenomeHologramSignal } from "@/features/identity-intelligence/hologram-signals";

export type HologramPhase =
  | "idle"
  | "genome_creation"
  | "genesis"
  | "cipher"
  | "chronos"
  | "forensiq"
  | "spectra"
  | "atlas"
  | "sentinel"
  | "safe"
  | "suspicious"
  | "impersonation";

export type GenomeAssemblyState = {
  label: string;
  detail: string;
  tone: "cyan" | "sky" | "violet" | "amber" | "rose";
  isAssembling: boolean;
  isStable: boolean;
};

export type GenomeOrbitNode = {
  id: string;
  label: string;
  icon: LucideIcon;
  evidenceCount: number;
  confidence: number | null;
  version?: string;
  lastUpdated?: string;
  sourceSignalIds: string[];
  position: readonly [number, number];
};

export type LivingHologramMetrics = {
  knowledgeObjects: number;
  evidenceSources: number;
  neuralLinks: number;
  confidence?: number;
  twinStatus: string;
  lastSynchronized?: string;
  stability: number;
  signalStrength: number;
};

export type { GenomeHologramSignal };
