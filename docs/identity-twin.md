# Identity Twin Intelligence

The Identity Twin is an evidence-bound reasoning surface, not a general-purpose chatbot. It answers only from the currently loaded Identity Genome and explicitly marks unsupported conclusions as unknown.

## Runtime flow

```text
Question
  -> IntentDetector
  -> GenomeRetriever
  -> EvidenceSelector
  -> ReasoningEngine
  -> TwinResponseBuilder
  -> Answer + confidence + evidence + limitations
```

`IdentityTwinService` composes the five reusable services. The page consumes the existing Identity Intelligence BFF and the browser-held opaque Genome session identifier; it does not introduce a second persistence path or bypass the backend.

## Current evidence boundary

Supported answers are deterministic templates over extracted communication, writing, professional-tone, and observed-vocabulary features. The Twin can also explain source coverage, Genome version, and existing timeline references.

It does not claim verified skills, goals, values, relationships, career history, personal preferences, or real-world timeline facts. Artifact comparison requires the actual artifact to enter the existing investigation flow.

The current backend exposes a latest text-feature snapshot and a sample-count coverage heuristic. Therefore, the UI labels source names as analyzed coverage rather than per-trait attribution, and makes the confidence boundary visible. A future connector can add richer knowledge objects to the Genome without changing the Twin conversation interface.
