import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { GuardianRecommendation } from "@/features/guardian/types";

export class GuardianRecommendationEngine {
  recommend(snapshot: GenomeSnapshot): GuardianRecommendation[] {
    const categories = new Set(snapshot.identityFacts.map((fact) => fact.category));
    const recommendations: GuardianRecommendation[] = [];
    if (!categories.has("career")) recommendations.push({ id: "resume", title: "Add resume text", detail: "Add a consented plain-text resume to provide direct career and education facts.", href: "/genome", availability: "available_now" });
    if (!categories.has("projects") && !categories.has("technologies")) recommendations.push({ id: "portfolio", title: "Add portfolio evidence", detail: "Add a consented portfolio excerpt with directly stated projects and technologies.", href: "/genome", availability: "available_now" });
    if (!categories.has("goals")) recommendations.push({ id: "goals", title: "Add direct goals", detail: "Add a personal note that explicitly states the goals you want your Genome to retain.", href: "/genome", availability: "available_now" });
    if (!snapshot.sources.some((source) => source.sourceId === "gmail")) recommendations.push({ id: "gmail", title: "Connect Gmail for communication evidence", detail: "Gmail can improve writing coverage through read-only, consented sent-email synchronization. It is not used to invent identity facts.", href: "/gmail", availability: "available_now" });
    return recommendations.slice(0, 3);
  }
}
