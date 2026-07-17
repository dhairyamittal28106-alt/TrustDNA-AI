from pydantic import BaseModel, ConfigDict

from app.agents.contracts import AgentResult
from app.domain.enums import RiskLevel, Verdict


class RiskAssessment(BaseModel):
    model_config = ConfigDict(frozen=True)

    risk_level: RiskLevel
    verdict: Verdict
    rationale_codes: list[str]


class RiskEngine:
    """Pure decision boundary. Scoring policy is intentionally deferred to Phase 3."""

    def assess(self, results: list[AgentResult]) -> RiskAssessment:
        codes = {finding.code for result in results for finding in result.findings}
        if "writing_mismatch" in codes:
            return RiskAssessment(
                risk_level=RiskLevel.HIGH,
                verdict=Verdict.IMPERSONATION_CONFIRMED,
                rationale_codes=["writing_mismatch"],
            )
        if "writing_match" in codes:
            return RiskAssessment(
                risk_level=RiskLevel.LOW,
                verdict=Verdict.AUTHENTIC,
                rationale_codes=["writing_match"],
            )
        return RiskAssessment(
            risk_level=RiskLevel.LOW, verdict=Verdict.INCONCLUSIVE, rationale_codes=[]
        )
