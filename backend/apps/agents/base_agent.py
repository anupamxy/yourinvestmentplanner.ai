from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class AgentContext:
    user_id: str
    run_id: str
    profile: dict
    market_data: dict = field(default_factory=dict)
    analysis: dict = field(default_factory=dict)
    memory_context: list = field(default_factory=list)
    llm_response: str = ""
    errors: list = field(default_factory=list)


class BaseAgent(ABC):
    name: str = "base"

    @abstractmethod
    def run(self, context: AgentContext) -> AgentContext:
        """Execute agent logic, enrich and return context."""
        ...

    def _log_step(self, context: AgentContext, step_status: str, output: dict, duration_ms: int):
        from apps.agents.models import AgentStepLog, AgentRun
        try:
            run = AgentRun.objects.get(id=context.run_id)
            AgentStepLog.objects.create(
                run=run,
                agent_name=self.name,
                status=step_status,
                output=output,
                duration_ms=duration_ms,
            )
        except Exception:
            pass
