import time
from django.utils import timezone
from .base_agent import AgentContext
from .market_data_agent import MarketDataAgent
from .analysis_agent import AnalysisAgent
from .memory_agent import MemoryAgent
from .llm_agent import LLMAgent


class AgentOrchestrator:
    PIPELINE = ['market_data', 'analysis', 'memory', 'llm']

    def __init__(self, run_id: str, user_id: str):
        self.run_id = run_id
        self.user_id = user_id
        self.agents = {
            'market_data': MarketDataAgent(),
            'analysis': AnalysisAgent(),
            'memory': MemoryAgent(),
            'llm': LLMAgent(),
        }

    def execute(self):
        from apps.agents.models import AgentRun
        from apps.reports.models import InvestmentReport
        from apps.users.models import InvestmentProfile
        from apps.users.serializers import InvestmentProfileSerializer

        run = AgentRun.objects.get(id=self.run_id)
        run.status = 'running'
        run.save(update_fields=['status'])

        try:
            profile_obj = InvestmentProfile.objects.get(user_id=self.user_id)
            profile_data = InvestmentProfileSerializer(profile_obj).data
            # Add username to profile context
            profile_data['username'] = profile_obj.user.username
            profile_data['budget'] = float(profile_data['budget'])

            context = AgentContext(
                user_id=str(self.user_id),
                run_id=str(self.run_id),
                profile=profile_data,
            )

            for step_name in self.PIPELINE:
                agent = self.agents[step_name]
                context = agent.run(context)

            # Store recommendation in long-term memory
            self.agents['memory'].store_recommendation(context)

            # Persist report
            InvestmentReport.objects.create(
                user_id=self.user_id,
                agent_run_id=self.run_id,
                summary=context.llm_response[:500],
                full_report=context.llm_response,
                tickers=[p['ticker'] for p in context.analysis.get('top_picks', [])],
                market_snapshot=context.market_data,
                confidence_score=self._compute_confidence(context),
            )

            run.status = 'completed'
            run.completed_at = timezone.now()
            run.save(update_fields=['status', 'completed_at'])

        except Exception as e:
            run.status = 'failed'
            run.error_message = str(e)
            run.save(update_fields=['status', 'error_message'])
            raise

    def _compute_confidence(self, context: AgentContext) -> float:
        """Simple confidence score: higher if more tickers analyzed and no errors."""
        base = 0.7
        error_penalty = len(context.errors) * 0.1
        memory_bonus = min(len(context.memory_context) * 0.02, 0.1)
        picks_bonus = min(len(context.analysis.get('top_picks', [])) * 0.02, 0.1)
        return round(max(0.0, min(1.0, base - error_penalty + memory_bonus + picks_bonus)), 2)
