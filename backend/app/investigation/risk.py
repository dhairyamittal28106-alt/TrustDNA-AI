from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.agents.contracts import AgentResult
from app.domain.enums import RiskLevel, Verdict


class RiskAssessment(BaseModel):
    model_config = ConfigDict(frozen=True)

    risk_level: RiskLevel
    verdict: Verdict
    rationale_codes: list[str]
    confidence: float
    breakdown: ConfidenceBreakdown


class ConfidenceBreakdown(BaseModel):
    model_config = ConfigDict(frozen=True)

    writing: float
    behavior: float
    metadata: float
    timeline: float
    semantic: float
    weighted_score: float


class RiskEngine:
    """Pure decision boundary. Scoring policy is intentionally deferred to Phase 3."""

    def assess(self, results: list[AgentResult]) -> RiskAssessment:
        codes = {finding.code for result in results for finding in result.findings}
        writing_result = next(
            (result for result in results if result.agent.value == "cipher"), None
        )
        writing = 0.5
        if writing_result:
            writing = (
                writing_result.confidence
                if "writing_match" in codes
                else 1 - writing_result.confidence
            )
        breakdown = ConfidenceBreakdown(
            writing=round(writing, 4),
            behavior=0.5,
            metadata=0.5,
            timeline=0.5,
            semantic=0.5,
            weighted_score=round(
                (writing * 0.35) + (0.5 * 0.2) + (0.5 * 0.15) + (0.5 * 0.2) + (0.5 * 0.1), 4
            ),
        )
        if "writing_mismatch" in codes:
            return RiskAssessment(
                risk_level=RiskLevel.HIGH,
                verdict=Verdict.IMPERSONATION_CONFIRMED,
                rationale_codes=["writing_mismatch"],
                confidence=breakdown.weighted_score,
                breakdown=breakdown,
            )
        if "writing_match" in codes:
            return RiskAssessment(
                risk_level=RiskLevel.LOW,
                verdict=Verdict.AUTHENTIC,
                rationale_codes=["writing_match"],
                confidence=breakdown.weighted_score,
                breakdown=breakdown,
            )
        return RiskAssessment(
            risk_level=RiskLevel.LOW,
            verdict=Verdict.INCONCLUSIVE,
            rationale_codes=[],
            confidence=breakdown.weighted_score,
            breakdown=breakdown,
        )
