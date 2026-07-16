from app.agents.contracts import AgentResult, InvestigationAgent, InvestigationContext
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
