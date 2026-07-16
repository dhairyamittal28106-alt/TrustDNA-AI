import { FileText, Mail, Mic, ShieldCheck } from "lucide-react";

export const recentVerifications = [
  { name: "Strategy update.pdf", type: "Document", score: 96, time: "12 min ago", icon: FileText, state: "Verified" },
  { name: "jordan@venture.co", type: "Email", score: 42, time: "2 hr ago", icon: Mail, state: "Flagged" },
  { name: "Investor intro.wav", type: "Voice", score: 91, time: "Yesterday", icon: Mic, state: "Verified" },
  { name: "Identity attestation", type: "Credential", score: 100, time: "Jul 14", icon: ShieldCheck, state: "Verified" },
];

export const identitySignals = [
  { label: "Writing signature", value: 96 },
  { label: "Behavioral pattern", value: 93 },
  { label: "Timeline consistency", value: 98 },
  { label: "Semantic fingerprint", value: 95 },
];
