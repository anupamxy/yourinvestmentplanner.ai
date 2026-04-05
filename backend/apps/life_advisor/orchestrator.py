import logging
from django.utils import timezone
from .context import LifeAdvisorContext
from .web_research_agent import WebResearchAgent
from .life_llm_agent import run_life_llm

logger = logging.getLogger(__name__)


class LifeAdvisorOrchestrator:

    def __init__(self, run_id: str, user_id: str):
        self.run_id = run_id
        self.user_id = user_id

    def execute(self):
        from .models import LifeAdvisorRun
        from apps.users.models import LifeProfile
        from apps.users.serializers import LifeProfileSerializer

        run = LifeAdvisorRun.objects.get(id=self.run_id)
        run.status = 'running'
        run.save(update_fields=['status'])

        try:
            profile_obj = LifeProfile.objects.get(user_id=self.user_id)
            profile_data = LifeProfileSerializer(profile_obj).data
            profile_data['monthly_salary'] = float(profile_data['monthly_salary'])
            profile_data['monthly_expenses'] = float(profile_data['monthly_expenses'])
            profile_data['existing_savings'] = float(profile_data['existing_savings'])
            profile_data['username'] = profile_obj.user.username

            context = LifeAdvisorContext(
                user_id=str(self.user_id),
                run_id=str(self.run_id),
                life_profile=profile_data,
            )

            # Step 1 — Web Research
            logger.info(f"[LifeAdvisor] Starting web research for run {self.run_id}")
            context = WebResearchAgent().run(context)

            # Step 2 — LLM structured report
            logger.info(f"[LifeAdvisor] Running LLM for run {self.run_id}")
            context.structured_report = run_life_llm(context)

            run.report = context.structured_report
            run.web_sources = context.web_research
            run.status = 'completed'
            run.completed_at = timezone.now()
            run.save(update_fields=['status', 'report', 'web_sources', 'completed_at'])

        except Exception as e:
            logger.error(f"LifeAdvisorOrchestrator failed: {e}")
            run.status = 'failed'
            run.error_message = str(e)
            run.save(update_fields=['status', 'error_message'])
            raise
