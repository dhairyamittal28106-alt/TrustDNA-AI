# Gmail Integration

TrustDNA’s Gmail source is a consent-led, manual synchronization flow. It requests only Google’s `gmail.readonly` scope and analyzes a batch of sent messages so communication evidence is tied to material the account holder chose to provide.

## Required configuration

Set the existing Firebase public variables in `.env.local`, then configure the matching Firebase/Google Cloud project:

- Enable the Google sign-in provider in Firebase Authentication.
- Add every local or deployed hostname to Firebase Authentication’s authorized domains.
- Enable the Gmail API for the same Google Cloud project.
- Add the Google OAuth consent screen details required by the Gmail read-only scope.
- Optionally set the server-only `GMAIL_SYNC_MAX_MESSAGES` value. Its default is `25` and the implementation caps it at `100`.

The FastAPI service address remains `TRUSTDNA_API_BASE_URL`.

## Synchronization boundary

1. A signed-in user opens `/gmail` and explicitly approves Gmail read-only access.
2. The browser holds the short-lived Google access token only long enough to call the TrustDNA Gmail sync route.
3. The server reads a bounded batch from the user’s Gmail `Sent` mailbox, extracts plain-text bodies, and removes identifiable quoted reply lines where possible.
4. The deterministic communication extractor normalizes that material and sends it through the existing Identity Genome ingestion contract with the source label `Gmail sent-email sync`.
5. FastAPI creates a new Identity Genome version. The browser refreshes Guardian and Identity Twin state from that version.

OAuth tokens and raw Gmail message content are never written to browser storage by this implementation. The browser retains only connection metadata such as the linked account, last sync, message count, and Genome version.

## Disconnect and deletion

Disconnecting removes the local connection record and prevents future Gmail syncs from this browser session. It does not revoke Google consent or delete an existing evidence-backed Genome version.

Selective deletion of a previous Gmail-derived Genome version is intentionally not presented as available: the current backend has no source-level Genome retraction contract. Adding it requires a backend data-retention and version-rebuild design rather than a misleading client-side delete button.
