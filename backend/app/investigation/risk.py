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
        return RiskAssessment(
            risk_level=RiskLevel.LOW, verdict=Verdict.INCONCLUSIVE, rationale_codes=[]
        )
