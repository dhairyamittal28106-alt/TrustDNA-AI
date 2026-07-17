from app.agents.contracts import (
    AgentResult,
    EvidenceItem,
    Finding,
    InvestigationAgent,
    InvestigationContext,
)
from app.domain.enums import AgentName


class StubInvestigationAgent(InvestigationAgent):
    """Contract-preserving placeholder until Phase 6 model integrations."""

    def __init__(self, name: AgentName) -> None:
        self.name = name

    async def investigate(self, context: InvestigationContext) -> AgentResult:
        return AgentResult(
            agent=self.name,
            confidence=0.0,
            limitations=["agent_not_implemented"],
            processing_time_ms=0,
            version="v1",
        )


class CipherAgent(InvestigationAgent):
    """Deterministic writing comparison used for the Phase 2 vertical slice."""

    name = AgentName.CIPHER

    async def investigate(self, context: InvestigationContext) -> AgentResult:
        candidate_words = {
            word.lower() for word in context.artifact_text.split() if len(word.strip(".,!?;:")) > 2
        }
        overlap = candidate_words & context.identity_vocabulary
        denominator = max(len(candidate_words), 1)
        match = len(overlap) / denominator
        if match >= 0.35:
            finding = "writing_match"
            severity = "info"
            evidence_code = "writing_signature_consistent"
        else:
            finding = "writing_mismatch"
            severity = "high"
            evidence_code = "writing_signature_mismatch"
        return AgentResult(
            agent=self.name,
            confidence=round(match if match >= 0.35 else 1 - match, 4),
            findings=[Finding(code=finding, severity=severity, evidence_codes=[evidence_code])],
            evidence=[
                EvidenceItem(
                    code=evidence_code,
                    category="writing_signature",
                    weight=round(match if match >= 0.35 else 1 - match, 4),
                    source_reference=context.artifact_reference,
                )
            ],
            processing_time_ms=0,
            version="v1",
        )
