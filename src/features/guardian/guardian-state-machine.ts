import type { GuardianEvent, GuardianState } from "@/features/guardian/types";

export class GuardianStateMachine {
  transition(event: GuardianEvent): GuardianState {
    switch (event.type) {
      case "evidence_added":
      case "genome_updated": return "learning";
      case "gmail_sync": return "synchronizing";
      case "twin_thinking": return "thinking";
      case "investigation_started": return "investigating";
      case "threat_detected": return "warning";
      case "twin_answered":
      case "unknown_question":
      case "investigation_completed":
      case "certificate_generated":
      case "login": return "monitoring";
    }
  }
}
