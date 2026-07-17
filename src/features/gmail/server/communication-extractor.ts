import "server-only";

import type { GmailMessage } from "@/features/gmail/server/gmail-connector";

export type GmailCommunicationArtifact = {
  content: string;
  messagesAnalyzed: number;
  charactersAnalyzed: number;
  frequentPhrases: string[];
};

export class CommunicationExtractor {
  extract(messages: GmailMessage[]): GmailCommunicationArtifact {
    const bodies = messages.map((message) => normalizeMessage(message.body)).filter(Boolean);
    const content = bodies.map((body, index) => `--- Sent email ${index + 1} ---\n${body}`).join("\n\n");
    return {
      content,
      messagesAnalyzed: bodies.length,
      charactersAnalyzed: content.length,
      frequentPhrases: frequentPhrases(bodies),
    };
  }
}

function normalizeMessage(value: string): string {
  return value
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith(">"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function frequentPhrases(messages: string[]): string[] {
  const counts = new Map<string, number>();
  for (const message of messages) {
    const words = message.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? [];
    for (let index = 0; index < words.length - 1; index += 1) {
      const phrase = `${words[index]} ${words[index + 1]}`;
      if (phrase.length < 7 || commonPhrase(phrase)) continue;
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([phrase]) => phrase);
}

function commonPhrase(value: string): boolean {
  return ["thank you", "please let", "let me", "this is", "have a", "with the", "for the", "from the"].includes(value);
}
