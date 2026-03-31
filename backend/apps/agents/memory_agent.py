import time
from datetime import date
from .base_agent import BaseAgent, AgentContext


class MemoryAgent(BaseAgent):
    name = "memory"

    def __init__(self):
        self._vector_store = None

    @property
    def vector_store(self):
        if self._vector_store is None:
            from apps.memory.vector_store import VectorStoreService
            self._vector_store = VectorStoreService()
        return self._vector_store

    def run(self, context: AgentContext) -> AgentContext:
        """Retrieve relevant past memories before LLM call."""
        t0 = time.time()
        try:
            query_text = self._build_query(context.profile, context.analysis)
            memories = self.vector_store.query(
                user_id=context.user_id,
                query_text=query_text,
                n_results=5,
            )
            context.memory_context = [m['document'] for m in memories]

            duration = int((time.time() - t0) * 1000)
            self._log_step(
                context, 'done',
                {'memories_retrieved': len(context.memory_context)},
                duration,
            )

        except Exception as e:
            context.errors.append(f"MemoryAgent error: {str(e)}")
            context.memory_context = []
            duration = int((time.time() - t0) * 1000)
            self._log_step(context, 'error', {'error': str(e)}, duration)

        return context

    def store_recommendation(self, context: AgentContext):
        """Persist the LLM output as a new memory entry after pipeline completes."""
        try:
            from apps.memory.models import MemoryEntry

            top_tickers = [p['ticker'] for p in context.analysis.get('top_picks', [])]
            summary_snippet = context.llm_response[:600] if context.llm_response else ''

            content = (
                f"Date: {date.today().isoformat()}. "
                f"Risk profile: {context.profile.get('risk_tolerance')}. "
                f"Sectors: {', '.join(context.profile.get('sectors', []))}. "
                f"Top recommendations: {', '.join(top_tickers)}. "
                f"Summary: {summary_snippet}"
            )

            self.vector_store.add(
                user_id=context.user_id,
                doc_id=context.run_id,
                text=content,
                metadata={
                    'run_id': context.run_id,
                    'entry_type': 'recommendation',
                    'date': date.today().isoformat(),
                    'tickers': top_tickers,
                },
            )

            MemoryEntry.objects.create(
                user_id=context.user_id,
                entry_type='recommendation',
                content=content,
                embedding_id=context.run_id,
                metadata={
                    'run_id': context.run_id,
                    'tickers': top_tickers,
                },
            )
        except Exception:
            pass  # Memory storage failure shouldn't break the pipeline

    def _build_query(self, profile: dict, analysis: dict) -> str:
        tickers = [p['ticker'] for p in analysis.get('top_picks', [])]
        return (
            f"Investment goal: {profile.get('investment_goal', '')}. "
            f"Risk: {profile.get('risk_tolerance', '')}. "
            f"Sectors: {', '.join(profile.get('sectors', []))}. "
            f"Tickers considered: {', '.join(tickers)}."
        )
