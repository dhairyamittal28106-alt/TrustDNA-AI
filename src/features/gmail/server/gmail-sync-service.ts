import "server-only";

import { CommunicationExtractor } from "@/features/gmail/server/communication-extractor";
import { GmailApiError, GmailConnector } from "@/features/gmail/server/gmail-connector";
import { GenomeUpdateService } from "@/features/gmail/server/genome-update-service";
import type { GmailSyncResult } from "@/features/gmail/types";

export class GmailSyncService {
  constructor(
    private readonly connector = new GmailConnector(),
    private readonly communicationExtractor = new CommunicationExtractor(),
    private readonly genomeUpdateService = new GenomeUpdateService(),
  ) {}

  async sync(input: { accessToken: string; genomeId?: string; displayName: string }): Promise<GmailSyncResult> {
    const messages = await this.connector.listSentMessages(input.accessToken, configuredMessageLimit());
    const artifact = this.communicationExtractor.extract(messages);
    if (!artifact.content || !artifact.messagesAnalyzed) throw new GmailApiError("No readable sent messages were available for this Gmail account. TrustDNA did not update your Genome.", 422, "GMAIL_NO_SENT_MESSAGES");

    const sourceLabel = "Gmail sent-email sync";
    const update = await this.genomeUpdateService.update({
      genomeId: input.genomeId,
      displayName: input.displayName,
      content: artifact.content,
      sourceLabel,
    });
    return {
      ...update,
      summary: {
        messagesAnalyzed: artifact.messagesAnalyzed,
        charactersAnalyzed: artifact.charactersAnalyzed,
        frequentPhrases: artifact.frequentPhrases,
        sourceLabel,
        syncedAt: new Date().toISOString(),
      },
    };
  }
}

function configuredMessageLimit(): number {
  const configured = Number.parseInt(process.env.GMAIL_SYNC_MAX_MESSAGES ?? "25", 10);
  if (!Number.isFinite(configured)) return 25;
  return Math.min(Math.max(configured, 1), 100);
}
