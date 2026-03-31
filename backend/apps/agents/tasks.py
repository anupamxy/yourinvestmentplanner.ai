from celery import shared_task


@shared_task(bind=True, max_retries=0)
def run_agent_pipeline(self, run_id: str, user_id: str):
    """Celery task: execute the full agent pipeline asynchronously."""
    from .orchestrator import AgentOrchestrator
    orchestrator = AgentOrchestrator(run_id=run_id, user_id=user_id)
    orchestrator.execute()


def run_synchronously(run_id: str, user_id: str):
    """Fallback for running without Celery (uses a thread)."""
    import django
    import os
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        django.setup()
    except RuntimeError:
        pass  # Already set up
    from .orchestrator import AgentOrchestrator
    orchestrator = AgentOrchestrator(run_id=run_id, user_id=user_id)
    orchestrator.execute()
