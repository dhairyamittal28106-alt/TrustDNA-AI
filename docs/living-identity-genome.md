# Living Identity Genome

TrustDNA’s Identity Genome evolves only when the existing deterministic ingestion pipeline records new evidence. Every successful plain-text ingestion already returns a backend-created `IdentityGenomeVersionResponse`; Phase 11 turns those facts into an explainable evolution experience.

## Architecture

```text
Supported source ingestion
  -> existing artifact analysis + Identity Profile
  -> backend Genome version record
  -> GenomeEvolutionService
       -> GenomeVersionManager
       -> GenomeDiffEngine
       -> GuardianInsightService
       -> RecommendationEngine
       -> TwinSynchronizationService
```

- `GenomeVersionManager` orders versioned backend snapshots and uses the backend-recorded source label for each version.
- `GenomeDiffEngine` compares only source counts, coverage values, observed domain terms, and deterministic writing/communication fields returned by the backend.
- `GuardianInsightService` turns a diff into a restrained deterministic observation.
- `RecommendationEngine` describes evidence that would broaden coverage while clearly marking unavailable connectors and extractors as future support.
- `TwinSynchronizationService` emits a client-side Genome-version refresh event. The Twin reloads the latest backend snapshot on receipt and always displays the version it is reasoning with.

## Evidence boundary

The backend records the submitted source label, observed-domain-term delta, coverage delta, and a deterministic Guardian observation with each text-ingestion version.

The backend’s `confidence` remains its deterministic source-count coverage heuristic. It is shown as coverage confidence and never as a probability of truth. Current/latest feature snapshots may include observed terms, writing and communication signals; they do not establish verified skills, career history, goals, values, relationships, or behavioral traits.
