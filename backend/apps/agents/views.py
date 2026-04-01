import json
import time
import uuid
from django.http import StreamingHttpResponse, JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from .models import AgentRun
from .serializers import AgentRunSerializer


def _get_user_from_request(request):
    """Extract and validate JWT token from Authorization header or query param."""
    User = get_user_model()
    token_str = None

    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        token_str = auth_header.split(' ', 1)[1]

    # Also accept ?token= in query string (EventSource can't set headers)
    if not token_str:
        token_str = request.GET.get('token')

    if not token_str:
        return None

    try:
        token = AccessToken(token_str)
        return User.objects.get(id=token['user_id'])
    except (InvalidToken, TokenError, User.DoesNotExist):
        return None


class AgentRunCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not hasattr(request.user, 'profile'):
            return Response(
                {'error': 'Investment profile required. Please set your preferences first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for an already running pipeline
        active = AgentRun.objects.filter(user=request.user, status__in=['pending', 'running']).first()
        if active:
            return Response(
                {'error': 'A pipeline is already running.', 'run_id': str(active.id)},
                status=status.HTTP_409_CONFLICT,
            )

        run = AgentRun.objects.create(user=request.user, status='pending')

        # Dispatch async Celery task
        try:
            from .tasks import run_agent_pipeline
            run_agent_pipeline.delay(str(run.id), str(request.user.id))
        except Exception:
            # Fallback: run synchronously if Celery/Redis is not available
            from .tasks import run_synchronously
            import threading
            t = threading.Thread(
                target=run_synchronously,
                args=(str(run.id), str(request.user.id)),
                daemon=True,
            )
            t.start()

        return Response({'run_id': str(run.id), 'status': 'pending'}, status=status.HTTP_202_ACCEPTED)


class AgentRunCancelView(APIView):
    """Cancel a pending or running pipeline so a new one can be started."""
    permission_classes = [IsAuthenticated]

    def post(self, request, run_id):
        try:
            run = AgentRun.objects.get(id=run_id, user=request.user)
        except AgentRun.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if run.status not in ('pending', 'running'):
            return Response(
                {'detail': f'Run is already {run.status}, cannot cancel.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        run.status = 'cancelled'
        run.error_message = 'Cancelled by user.'
        run.save(update_fields=['status', 'error_message'])
        return Response({'detail': 'Pipeline cancelled.', 'run_id': str(run.id)})


class AgentRunListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        runs = AgentRun.objects.filter(user=request.user).prefetch_related('steps')[:20]
        return Response(AgentRunSerializer(runs, many=True).data)


class AgentRunDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, run_id):
        try:
            run = AgentRun.objects.prefetch_related('steps').get(id=run_id, user=request.user)
        except AgentRun.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AgentRunSerializer(run).data)


@method_decorator(csrf_exempt, name='dispatch')
class AgentRunStreamView(View):
    """
    Plain Django view (not DRF APIView) for Server-Sent Events.
    DRF's content negotiation rejects 'text/event-stream' Accept headers,
    so this view handles JWT auth manually and bypasses DRF entirely.
    Token can be passed as Authorization header or ?token= query param
    (EventSource in browsers cannot set custom headers).
    """

    def get(self, request, run_id):
        user = _get_user_from_request(request)
        if user is None:
            return JsonResponse({'detail': 'Unauthorized.'}, status=401)

        try:
            AgentRun.objects.get(id=run_id, user=user)
        except AgentRun.DoesNotExist:
            return JsonResponse({'detail': 'Not found.'}, status=404)

        def event_stream():
            last_step_count = 0
            for _ in range(180):  # 3-minute max
                try:
                    run = AgentRun.objects.prefetch_related('steps').get(id=run_id)
                    steps = list(run.steps.values())

                    if len(steps) > last_step_count:
                        for step in steps[last_step_count:]:
                            step_data = {
                                k: str(v) if (hasattr(v, 'isoformat') or isinstance(v, uuid.UUID)) else v
                                for k, v in step.items()
                            }
                            yield f"data: {json.dumps({'type': 'step', 'step': step_data})}\n\n"
                        last_step_count = len(steps)

                    if run.status in ('completed', 'failed', 'cancelled'):
                        payload = {
                            'type': 'done',
                            'status': run.status,
                            'run_id': str(run.id),
                        }
                        if run.status == 'completed':
                            try:
                                payload['report_id'] = str(run.report.id)
                            except Exception:
                                pass
                        yield f"data: {json.dumps(payload)}\n\n"
                        break

                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                    break

                time.sleep(1)

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        response['Access-Control-Allow-Origin'] = '*'
        return response
