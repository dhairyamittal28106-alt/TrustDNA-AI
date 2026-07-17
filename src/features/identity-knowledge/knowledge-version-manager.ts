import type { GenomeTimelineEvent } from "@/features/identity-intelligence/types";
import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";

export class KnowledgeVersionManager {
  timeline(objects: IdentityKnowledgeObject[]): GenomeTimelineEvent[] {
    const events: GenomeTimelineEvent[] = [];
    for (const object of objects) {
      if (object.status === "active") {
        events.push({
          id: `knowledge-${object.id}`,
          title: `${object.title} recorded`,
          detail: `${object.value} · ${object.provenance.source} · ${object.provenance.version}`,
          timestamp: object.provenance.timestamp,
          origin: "extracted",
        });
      }
    }
    const factKeys = Array.from(new Set(objects.map((object) => object.factKey)));
    for (const factKey of factKeys) {
      const previous = objects.find((object) => object.factKey === factKey && object.status === "superseded");
      const current = objects.find((object) => object.factKey === factKey && object.status === "active");
      if (previous && current) {
        events.push({
          id: `knowledge-update-${previous.id}-${current.id}`,
          title: `${current.title} updated`,
          detail: `${previous.value} → ${current.value}`,
          timestamp: current.provenance.timestamp,
          origin: "extracted",
        });
      }
    }
    return events;
  }
}
