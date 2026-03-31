import json
import time
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import AgentRun
from .serializers import AgentRunSerializer


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


class AgentRunStreamView(APIView):
    """Server-Sent Events endpoint for real-time pipeline progress."""
    permission_classes = [IsAuthenticated]

    def get(self, request, run_id):
        try:
            AgentRun.objects.get(id=run_id, user=request.user)
        except AgentRun.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        def event_stream():
            last_step_count = 0
            for _ in range(180):  # 3-minute max
                try:
                    run = AgentRun.objects.prefetch_related('steps').get(id=run_id)
                    steps = list(run.steps.values())

                    if len(steps) > last_step_count:
                        for step in steps[last_step_count:]:
                            # Convert datetime to string for JSON serialization
                            step_data = {k: str(v) if hasattr(v, 'isoformat') else v for k, v in step.items()}
                            yield f"data: {json.dumps({'type': 'step', 'step': step_data})}\n\n"
                        last_step_count = len(steps)

                    if run.status in ('completed', 'failed'):
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
        return response
