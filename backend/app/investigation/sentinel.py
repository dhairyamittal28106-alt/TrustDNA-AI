import asyncio
import time

import structlog

from app.agents.contracts import AgentResult, InvestigationAgent, InvestigationContext
from app.investigation.risk import RiskAssessment, RiskEngine


class SentinelOrchestrator:
    """Coordinates investigators; Sentinel never analyzes an artifact itself."""

    def __init__(self, agents: list[InvestigationAgent], risk_engine: RiskEngine) -> None:
        self._agents = agents
        self._risk_engine = risk_engine
        self._logger = structlog.get_logger("trustdna.sentinel")

    async def _invoke(
        self, agent: InvestigationAgent, context: InvestigationContext
    ) -> AgentResult:
        started = time.perf_counter()
        self._logger.info("agent_started", case_id=str(context.case_id), agent=agent.name)
        try:
            result = await agent.investigate(context)
            self._logger.info(
                "agent_completed",
                case_id=str(context.case_id),
                agent=agent.name,
                latency_ms=round((time.perf_counter() - started) * 1000),
                evidence_count=len(result.evidence),
                confidence=result.confidence,
                errors=[],
            )
            return result
        except Exception as error:
            self._logger.error(
                "agent_failed",
                case_id=str(context.case_id),
                agent=agent.name,
                latency_ms=round((time.perf_counter() - started) * 1000),
                evidence_count=0,
                confidence=0,
                errors=[type(error).__name__],
            )
            raise

    async def investigate(
        self, context: InvestigationContext
    ) -> tuple[list[AgentResult], RiskAssessment]:
        results = await asyncio.gather(*(self._invoke(agent, context) for agent in self._agents))
        return results, self._risk_engine.assess(results)
