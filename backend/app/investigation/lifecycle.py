from app.core.errors import DomainError
from app.domain.enums import CaseLifecycleState


class CaseLifecycle:
    _allowed = {
        CaseLifecycleState.CASE_CREATED: {CaseLifecycleState.COLLECTING_EVIDENCE},
        CaseLifecycleState.COLLECTING_EVIDENCE: {CaseLifecycleState.DISPATCHING_AGENTS},
        CaseLifecycleState.DISPATCHING_AGENTS: {CaseLifecycleState.AWAITING_RESULTS},
        CaseLifecycleState.AWAITING_RESULTS: {CaseLifecycleState.AGGREGATING},
        CaseLifecycleState.AGGREGATING: {CaseLifecycleState.RISK_ANALYSIS},
        CaseLifecycleState.RISK_ANALYSIS: {CaseLifecycleState.GENERATING_FINDINGS},
        CaseLifecycleState.GENERATING_FINDINGS: {CaseLifecycleState.GENERATING_CERTIFICATE},
        CaseLifecycleState.GENERATING_CERTIFICATE: {CaseLifecycleState.CLOSED},
        CaseLifecycleState.CLOSED: set(),
    }

    @classmethod
    def transition(
        cls, current: CaseLifecycleState, target: CaseLifecycleState
    ) -> CaseLifecycleState:
        if target not in cls._allowed[current]:
            raise DomainError(
                "INVALID_CASE_TRANSITION",
                f"Cannot transition case from {current} to {target}",
                409,
                {"current": current, "target": target},
            )
        return target
