# Identity Intelligence Engine

The Identity Intelligence Engine turns consented source evidence into an explainable Identity Genome. It is deliberately separate from Sentinel and the investigation pipeline: the Genome establishes a baseline; Sentinel uses that baseline during a case.

## Current flow

```text
Consented plain text / TXT / Markdown
  -> Identity Intelligence BFF
  -> FastAPI Artifact Pipeline
  -> Identity Profile + Genome Version
  -> Deterministic Knowledge Extractor
  -> Knowledge Objects
  -> Genome Snapshot + Guardian Insights
  -> Identity Genome Viewer
```

The existing FastAPI pipeline remains the source of extracted truth:

```text
Artifact Classifier
  -> Text Extractor
  -> Normalizer
  -> PII Redactor
  -> Metadata Extractor
  -> Evidence Feature Extractor
  -> Chunker
  -> Embedding Provider
  -> Identity Profile + Version
```

## Module boundaries

- `types.ts` — shared source, feature, knowledge, and snapshot contracts.
- `source-registry.ts` — primary-source, format, and connector registry with explicit capability state.
- `contracts.ts` — replaceable `KnowledgeExtractor`, `GenomeBuilder`, `GenomeStore`, `SourceRegistry`, and `ConnectorRegistry` interfaces. `DeterministicKnowledgeExtractor` maps only FastAPI-returned features.
- `adapter.ts` — builds the view-ready Genome Snapshot, version timeline, provenance-aware sections, and Guardian insights.
- `session.ts` — browser-session reference store. It holds opaque genome/source metadata only; it never stores raw source text.
- `api.ts` and `/api/identity-intelligence` — thin Next.js BFF adapter for the existing FastAPI identity endpoints.
- `components/` — source intake, viewer, source coverage, graph, radar, timeline, and Guardian surfaces.

## Evidence states

Every user-facing data point has one of these states:

- **Extracted** — returned directly by the deterministic FastAPI text pipeline.
- **Derived** — a transparent presentation of extracted data, such as “Genome v2 recorded.”
- **Awaiting evidence** — intentionally empty because no supported extractor has returned evidence.
- **Preview** — a future capability description, never a claim about the user.

## Current capability boundary

The MVP supports consented plain text, `.txt`, and `.md` files. PDF, DOCX, audio, certificates, connectors, and OAuth are visible in the registry but remain explicitly unavailable until their dedicated extractors and provenance contracts are added.

The FastAPI identity repositories are intentionally in-memory for the current MVP. The frontend retains only an opaque reference in browser session storage so it can retrieve a live Genome while the backend process remains available. Durable per-user Genome retrieval needs a future authenticated Firebase-user-to-backend-genome mapping and persistent repository.
