import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { GuardianEvent } from "@/features/guardian/types";

export class GuardianInsightGenerator {
  generate(snapshot: GenomeSnapshot, event?: GuardianEvent): string[] {
    const facts = snapshot.identityFacts;
    const insights: string[] = [];
    if (event?.type === "gmail_sync") insights.push("I synchronized the latest Gmail communication evidence. No personal fact was added unless it was directly stated in supported evidence.");
    if (event?.type === "twin_thinking") insights.push("I am retrieving structured Identity Knowledge before writing features.");
    if (event?.type === "unknown_question") insights.push("I kept the answer unknown because the current Identity Knowledge Graph has no direct supporting fact.");
    if (event?.type === "investigation_completed") insights.push("I recorded the completed investigation state without changing unsupported identity facts.");
    if (facts.length) insights.push(`I currently track ${facts.length} active direct identity fact${facts.length === 1 ? "" : "s"} from your consented evidence.`);
    if (!facts.some((fact) => fact.category === "goals")) insights.push("I do not yet have direct evidence about your long-term goals.");
    if (!facts.some((fact) => fact.category === "education")) insights.push("I do not yet have direct evidence about your education history.");
    return insights.slice(0, 3);
  }
}
