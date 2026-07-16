from app.agents.contracts import AgentResult, InvestigationAgent, InvestigationContext
from app.investigation.risk import RiskAssessment, RiskEngine


class SentinelOrchestrator:
    """Coordinates investigators; Sentinel never analyzes an artifact itself."""

    def __init__(self, agents: list[InvestigationAgent], risk_engine: RiskEngine) -> None:
        self._agents = agents
        self._risk_engine = risk_engine

    async def investigate(
        self, context: InvestigationContext
    ) -> tuple[list[AgentResult], RiskAssessment]:
        results = [await agent.investigate(context) for agent in self._agents]
        return results, self._risk_engine.assess(results)
