import json
import logging
import threading
import time as time_module

from django.contrib.auth import get_user_model
from django.http import StreamingHttpResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import AccessToken

from .models import LifeAdvisorRun
from .orchestrator import LifeAdvisorOrchestrator

logger = logging.getLogger(__name__)
User = get_user_model()


class LifeAdvisorRunCreateView(APIView):
    """POST — start a new life advisor run."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.users.models import LifeProfile

        if not hasattr(request.user, 'life_profile'):
            return Response({'error': 'Life profile not found. Please complete your life profile first.'}, status=400)

        # Prevent concurrent runs
        active = LifeAdvisorRun.objects.filter(user=request.user, status__in=['pending', 'running']).first()
        if active:
            return Response({'error': 'A run is already in progress.', 'run_id': str(active.id)}, status=409)

        run = LifeAdvisorRun.objects.create(user=request.user)

        # Run in background thread (Celery optional)
        thread = threading.Thread(
            target=LifeAdvisorOrchestrator(str(run.id), str(request.user.id)).execute,
            daemon=True,
        )
        thread.start()

        return Response({'run_id': str(run.id), 'status': run.status}, status=201)


@method_decorator(csrf_exempt, name='dispatch')
class LifeAdvisorStreamView(View):
    """
    GET  — SSE stream for a life advisor run.
    Polls the DB every 2 s and pushes status updates.
    Closes when run reaches completed / failed.
    """

    def _get_user(self, request):
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        token_str = request.GET.get('token', '')
        raw = auth.split(' ', 1)[1] if auth.startswith('Bearer ') else token_str
        if not raw:
            return None
        try:
            token = AccessToken(raw)
            return User.objects.get(id=token['user_id'])
        except Exception:
            return None

    def get(self, request, pk):
        user = self._get_user(request)
        if not user:
            return JsonResponse({'detail': 'Unauthorized'}, status=401)

        try:
            run = LifeAdvisorRun.objects.get(id=pk, user=user)
        except LifeAdvisorRun.DoesNotExist:
            return JsonResponse({'detail': 'Not found.'}, status=404)

        def event_stream():
            AGENTS = ['web_research', 'life_advisor']
            emitted_steps = set()
            last_status = None

            for _ in range(150):          # max ~5 min
                time_module.sleep(2)
                run.refresh_from_db()

                # Simulate agent step events based on status
                if run.status == 'running' and 'web_research' not in emitted_steps:
                    emitted_steps.add('web_research')
                    yield f"data: {json.dumps({'type': 'step', 'agent': 'web_research', 'status': 'running'})}\n\n"

                if run.status == 'running' and 'web_research' in emitted_steps and 'life_advisor' not in emitted_steps:
                    # Check if web_research is done (heuristic: run has been running > 10s)
                    pass

                if run.status == 'completed':
                    if 'web_research' not in emitted_steps:
                        yield f"data: {json.dumps({'type': 'step', 'agent': 'web_research', 'status': 'done', 'sources': len(run.web_sources)})}\n\n"
                    if 'life_advisor' not in emitted_steps:
                        yield f"data: {json.dumps({'type': 'step', 'agent': 'life_advisor', 'status': 'done'})}\n\n"
                    yield f"data: {json.dumps({'type': 'done', 'status': 'completed', 'run_id': str(run.id), 'report': run.report, 'web_sources': run.web_sources})}\n\n"
                    return

                if run.status == 'failed':
                    yield f"data: {json.dumps({'type': 'done', 'status': 'failed', 'error': run.error_message})}\n\n"
                    return

                if run.status != last_status:
                    last_status = run.status
                    yield f"data: {json.dumps({'type': 'status', 'status': run.status})}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'status': 'failed', 'error': 'Timeout'})}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class LifeAdvisorRunDetailView(APIView):
    """GET — fetch a completed run's report."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            run = LifeAdvisorRun.objects.get(id=pk, user=request.user)
        except LifeAdvisorRun.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        return Response({
            'id': str(run.id),
            'status': run.status,
            'report': run.report,
            'web_sources': run.web_sources,
            'created_at': run.created_at,
            'completed_at': run.completed_at,
        })


class LifeAdvisorHistoryView(APIView):
    """GET — last 10 runs for the user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        runs = LifeAdvisorRun.objects.filter(user=request.user).values(
            'id', 'status', 'created_at', 'completed_at'
        )[:10]
        return Response(list(runs))
