import type { KnowledgeMergeResult, IdentityKnowledgeObject } from "@/features/identity-knowledge/types";

type LifecycleStage = "extraction" | "repository_before_merge" | "merge" | "repository_after_save" | "genome_snapshot" | "retriever_input";

type TraceRecord = {
  Type: string;
  Value: string;
  Evidence: string;
  Source: string;
  Version: string;
  Timestamp: string;
  "Object ID": string;
  "Mutation history": string[];
};

/**
 * Session-local observability for the direct Knowledge Object lifecycle.
 * It intentionally logs only consented object data already held in memory and
 * never writes raw Personal Notes to persistent storage.
 */
export class KnowledgeLifecycleTracer {
  private readonly history = new Map<string, string[]>();
  private readonly fingerprints = new Map<string, string>();

  trace(stage: LifecycleStage, objects: IdentityKnowledgeObject[]): void {
    if (typeof window === "undefined") return;
    console.groupCollapsed(`[TrustDNA][knowledge-lifecycle] ${stage} (${objects.length} objects)`);
    objects.forEach((object) => console.info("[TrustDNA][knowledge-object]", this.record(stage, object)));
    console.groupEnd();
  }

  traceMerge(result: KnowledgeMergeResult): void {
    result.added.forEach((object) => this.addHistory(object.id, `merge: added as ${object.status}`));
    result.updated.forEach(({ previous, current }) => {
      this.addHistory(previous.id, `merge: superseded by ${current.id}`);
      this.addHistory(current.id, `merge: replaced ${previous.id} for ${current.factKey}`);
    });
    this.trace("merge", result.objects);
  }

  private record(stage: LifecycleStage, object: IdentityKnowledgeObject): TraceRecord {
    const fingerprint = `${object.factKey}|${object.value}|${object.status}|${object.provenance.evidence}`;
    const previous = this.fingerprints.get(object.id);
    if (previous && previous !== fingerprint) this.addHistory(object.id, `${stage}: object payload changed from ${previous} to ${fingerprint}`);
    if (!previous) this.addHistory(object.id, `${stage}: observed`);
    this.fingerprints.set(object.id, fingerprint);
    return {
      Type: object.factKey,
      Value: object.value,
      Evidence: object.provenance.evidence,
      Source: object.provenance.source,
      Version: object.provenance.version,
      Timestamp: object.provenance.timestamp,
      "Object ID": object.id,
      "Mutation history": this.history.get(object.id) ?? [],
    };
  }

  private addHistory(objectId: string, entry: string): void {
    this.history.set(objectId, [...(this.history.get(objectId) ?? []), entry]);
  }
}
