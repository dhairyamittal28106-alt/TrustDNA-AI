import type { InvestigationProgressItem, LiveInvestigationEventType } from "@/features/live-investigation/types";

const definitions: Array<Pick<InvestigationProgressItem, "id" | "title" | "detail">> = [
  { id: "evidence_validated", title: "Evidence secured", detail: "The consented artifact has entered the investigation boundary." },
  { id: "genome_created", title: "Identity Genome prepared", detail: "A new evidence-bound Identity Genome was created." },
  { id: "artifact_processed", title: "Artifact processing complete", detail: "The backend text extractor classified, normalized, and analyzed the artifact." },
  { id: "knowledge_extracted", title: "Knowledge extracted", detail: "Direct statements were extracted with provenance; nothing was inferred." },
  { id: "genome_merged", title: "Genome merge complete", detail: "New and conflicting facts were merged into versioned history." },
  { id: "genome_updated", title: "Genome version updated", detail: "The backend recorded the latest analyzed Identity Genome version." },
  { id: "twin_refreshed", title: "Identity Twin refreshed", detail: "Twin retrieval now uses the current Identity Genome evidence." },
  { id: "guardian_updated", title: "Guardian updated", detail: "Guardian status now reflects the current evidence boundary." },
  { id: "case_created", title: "Case opened", detail: "Sentinel registered an evidence-backed investigation." },
  { id: "agents_dispatched", title: "Forensic agents dispatched", detail: "Specialists are analyzing the artifact through the backend pipeline." },
  { id: "evidence_correlated", title: "Evidence correlated", detail: "Sentinel combined returned specialist evidence into the case record." },
  { id: "risk_analyzed", title: "Risk analysis complete", detail: "The deterministic Risk Engine produced the final verdict." },
  { id: "certificate_generated", title: "Certificate generated", detail: "The returned certificate was bound to this investigation." },
  { id: "investigation_completed", title: "Verdict and certificate issued", detail: "The Risk Engine completed its evidence-backed decision." },
];

export class InvestigationProgressController {
  initial(createdGenome: boolean): InvestigationProgressItem[] {
    return definitions
      .filter((definition) => createdGenome || definition.id !== "genome_created")
      .map((definition) => ({ ...definition, status: "pending" }));
  }

  advance(items: InvestigationProgressItem[], event: LiveInvestigationEventType): InvestigationProgressItem[] {
    return items.map((item) => {
      if (item.id === event) return { ...item, status: "complete" };
      if (item.status === "pending" && definitions.findIndex((entry) => entry.id === item.id) < definitions.findIndex((entry) => entry.id === event)) return { ...item, status: "complete" };
      return item;
    });
  }

  fail(items: InvestigationProgressItem[]): InvestigationProgressItem[] {
    const active = items.find((item) => item.status === "active") ?? items.find((item) => item.status === "pending");
    return items.map((item) => item.id === active?.id ? { ...item, status: "error" } : item);
  }
}
