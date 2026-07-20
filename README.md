# TrustDNA AI

**The AI Trust Infrastructure for Human Identity.**

TrustDNA maps consented digital evidence into a versioned Identity Genome, investigates suspicious artifacts with explainable deterministic evidence, and makes trust decisions visible through case files, certificates, the Identity Twin, and the AI Analyst.

> Every investigation ends with evidence—not opinions.

## Product surfaces

- **Identity Genome** — versioned direct facts, communication measurements, provenance, and conflict history.
- **Identity Twin** — evidence-bounded answers and deterministic advisory reasoning; it does not invent memories or predict outcomes.
- **AI Analyst** — proactive, deterministic insight into evidence coverage, direct-fact trends, knowledge gaps, and recorded investigation metadata.
- **Investigation Engine / Judge Mode** — explainable case flow with specialized agents and Risk Engine verdicts.
- **TrustDNA Command Center** — snapshot-driven operational view of the user’s current identity evidence.

## Architecture

```text
Next.js client workspace
  ├─ Firebase authentication and browser-session profile state
  ├─ FastAPI API routes (Identity Genome, Gmail sync, investigations)
  ├─ Deterministic Identity Knowledge extraction and version history
  ├─ Evidence selection → reasoning → bounded Twin / Analyst responses
  └─ Visual case files, certificates, reports, and dashboard surfaces
```

The frontend is feature-oriented under `src/features`. Each feature owns its presentation and deterministic client services; API contracts remain separate from UI state.

## Local setup

Prerequisites: Node.js 20.9+, npm, and the FastAPI backend when running real API flows.

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

The frontend reads its backend base URL from `TRUSTDNA_API_BASE_URL`. Do not commit `.env.local`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `TRUSTDNA_API_BASE_URL` | FastAPI base URL used by Next.js route handlers. |
| `GMAIL_SYNC_MAX_MESSAGES` | Server-side cap for a manual Gmail sync (1–100). |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web configuration for authentication. |

Firebase configuration values are public web-app identifiers, not service-account secrets. Service credentials and OAuth tokens must never be placed in `NEXT_PUBLIC_*` variables.

## Quality checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

This repository currently has no test runner configured. The release gate runs lint, TypeScript, and the production build; add a test runner before claiming automated coverage.

## Security and privacy boundaries

- TrustDNA analyzes only user-consented sources.
- Identity facts are deterministic structured objects with source, timestamp, version, confidence, and evidence.
- The Twin and Analyst separate identity evidence, general advice, and unknown factors.
- Investigation history stores returned case metadata in browser session storage, never raw source artifacts.
- Gmail uses read-only consent and should be disconnected/revoked when no longer needed.

## Documentation

- [Identity Intelligence](docs/identity-intelligence.md)
- [Living Identity Genome](docs/living-identity-genome.md)
- [Identity Twin](docs/identity-twin.md)
- [Gmail integration](docs/gmail-integration.md)

## Deployment

Deploy the Next.js app to Vercel or another Node.js 20.9+ environment. Configure environment variables in the deployment provider, deploy the FastAPI backend independently, and restrict backend CORS to the deployed application origin. Verify Firebase authorized domains and Google OAuth consent-screen settings before release.

## Contributing

Keep changes feature-scoped, preserve API contracts unless a genuine bug requires a versioned change, and run all quality checks before committing. Never replace explainable evidence with an ungrounded model assertion.
