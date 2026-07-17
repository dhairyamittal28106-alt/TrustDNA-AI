import type { SourceDefinition } from "@/features/identity-intelligence/types";

export const primarySources: SourceDefinition[] = [
  { id: "resume", label: "Resume", description: "Paste a plain-text resume or import a TXT/Markdown export.", kind: "primary", availability: "text_ready", acceptsText: true },
  { id: "writing-sample", label: "Writing samples", description: "Analyze consented plain-text writing for explainable communication signals.", kind: "primary", availability: "text_ready", acceptsText: true },
  { id: "portfolio", label: "Portfolio", description: "Add a plain-text portfolio excerpt or Markdown export.", kind: "primary", availability: "text_ready", acceptsText: true },
  { id: "personal-notes", label: "Personal notes", description: "Add a consented plain-text note or Markdown export.", kind: "primary", availability: "text_ready", acceptsText: true },
  { id: "voice-sample", label: "Voice samples", description: "Record or upload voice evidence in the Investigation Workspace. Speech-to-text requires a verified transcript in the current platform.", kind: "primary", availability: "integration_ready" },
  { id: "certificate", label: "Certificates", description: "Certificate parsing and provenance extraction are coming soon.", kind: "primary", availability: "coming_soon" },
  { id: "document", label: "Documents", description: "Paste extracted document text or import TXT/Markdown now.", kind: "primary", availability: "text_ready", acceptsText: true },
];

export const formatSources: SourceDefinition[] = [
  { id: "pdf-upload", label: "PDF uploads", description: "A secure PDF extractor is coming soon.", kind: "format", availability: "coming_soon" },
  { id: "docx-upload", label: "DOCX uploads", description: "A secure DOCX extractor is coming soon.", kind: "format", availability: "coming_soon" },
  { id: "markdown", label: "Markdown", description: "Markdown can be analyzed as a plain-text source today.", kind: "format", availability: "text_ready", acceptsText: true },
  { id: "text-file", label: "Text files", description: "TXT files can be analyzed as a plain-text source today.", kind: "format", availability: "text_ready", acceptsText: true },
];

export const connectorSources: SourceDefinition[] = [
  { id: "google-drive", label: "Google Drive", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "google-docs", label: "Google Docs", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "gmail", label: "Gmail", description: "Consent-based sent-email synchronization.", kind: "connector", availability: "integration_ready" },
  { id: "outlook", label: "Outlook", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "github", label: "GitHub", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "gitlab", label: "GitLab", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "linkedin", label: "LinkedIn", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "x", label: "X (Twitter)", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "reddit", label: "Reddit", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "instagram", label: "Instagram", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "facebook", label: "Facebook", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "discord", label: "Discord", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "slack", label: "Slack", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "whatsapp-export", label: "WhatsApp Chat Export", description: "Importer coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "telegram-export", label: "Telegram Export", description: "Importer coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "spotify", label: "Spotify", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "youtube", label: "YouTube", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "google-calendar", label: "Google Calendar", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "notion", label: "Notion", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "obsidian", label: "Obsidian", description: "Importer coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "evernote", label: "Evernote", description: "Importer coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "google-keep", label: "Google Keep", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "apple-notes", label: "Apple Notes", description: "Importer coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "medium", label: "Medium", description: "Connector coming soon.", kind: "connector", availability: "coming_soon" },
  { id: "personal-website", label: "Personal Website", description: "Website verification is coming soon.", kind: "connector", availability: "coming_soon" },
];

export const sourceRegistry = [...primarySources, ...formatSources, ...connectorSources];

export const textReadySources = primarySources.filter((source) => source.acceptsText);

export function findSourceDefinition(sourceId: string): SourceDefinition | undefined {
  return sourceRegistry.find((source) => source.id === sourceId);
}
