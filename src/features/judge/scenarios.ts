import type { Scenario } from "@/features/judge/types";

export const judgeScenarios: Scenario[] = [
  {
    id: "fake-ceo-email",
    title: "Fake CEO email",
    subject: "Urgent payment instruction",
    artifactReference: "judge://fake-ceo-email.eml",
    candidateText: "URGENT: Wire the full payment to this new bank account immediately. Reply with your login code and do not contact finance.",
    seedText: "Hello team, our product strategy is built on careful research, clear communication, and practical decisions. Please coordinate with Finance through our standard process. Best, Aisha",
    icon: "mail",
  },
  {
    id: "cloned-voice",
    title: "Cloned emergency voice",
    subject: "Suspicious emergency transcript",
    artifactReference: "judge://cloned-emergency-voice.txt",
    candidateText: "PLEASE SEND MONEY NOW. I am in danger and cannot explain. Transfer it immediately and keep this confidential.",
    seedText: "Hi family, I always call before making important plans. I will explain clearly and use our usual family group chat for anything urgent. Love, Aisha",
    icon: "mic",
  },
  {
    id: "forged-resume",
    title: "Forged resume",
    subject: "Candidate identity claim",
    artifactReference: "judge://forged-resume.txt",
    candidateText: "World-leading crypto billionaire and classified intelligence strategist. Guaranteed instant returns and secret government credentials.",
    seedText: "I am a product engineer focused on accessible systems, research-led decisions, and collaborative delivery. My work values clarity, integrity, and measurable outcomes.",
    icon: "file",
  },
  {
    id: "fake-certificate",
    title: "Fake certificate",
    subject: "Unverified professional credential",
    artifactReference: "judge://forged-certificate.txt",
    candidateText: "OFFICIAL CERTIFICATE!!! Claim your credential today. Provide password verification and payment to unlock the final document.",
    seedText: "My professional portfolio documents verified projects, research, and outcomes. I share credentials through trusted organisations and transparent references.",
    icon: "certificate",
  },
];
