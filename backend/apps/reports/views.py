import json
import logging

from django.contrib.auth import get_user_model
from django.http import StreamingHttpResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import AccessToken

from .models import InvestmentReport
from .qa_chain import stream_qa_answer
from .serializers import InvestmentReportSerializer, InvestmentReportListSerializer

logger = logging.getLogger(__name__)
User = get_user_model()


class ReportListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reports = InvestmentReport.objects.filter(user=request.user)[:20]
        return Response(InvestmentReportListSerializer(reports, many=True).data)


class ReportDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            report = InvestmentReport.objects.get(id=pk, user=request.user)
        except InvestmentReport.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(InvestmentReportSerializer(report).data)

    def delete(self, request, pk):
        try:
            report = InvestmentReport.objects.get(id=pk, user=request.user)
        except InvestmentReport.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(csrf_exempt, name='dispatch')
class ReportQAView(View):
    """
    POST /api/v1/reports/:id/ask/
    Body: { "question": "..." }

    Streams the LLM answer as Server-Sent Events (text/event-stream).
    Auth via Authorization: Bearer <token> header.

    SSE event format:
      data: {"chunk": "<text>"}\n\n   — incremental token
      data: [DONE]\n\n               — stream complete
      data: {"error": "..."}\n\n     — error occurred
    """

    def _get_user(self, request):
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        if auth.startswith('Bearer '):
            try:
                token = AccessToken(auth.split(' ', 1)[1])
                return User.objects.get(id=token['user_id'])
            except Exception:
                pass
        return None

    def post(self, request, pk):
        user = self._get_user(request)
        if not user:
            return JsonResponse({'detail': 'Unauthorized'}, status=401)

        try:
            report = InvestmentReport.objects.get(id=pk, user=user)
        except InvestmentReport.DoesNotExist:
            return JsonResponse({'detail': 'Not found.'}, status=404)

        try:
            body = json.loads(request.body)
            question = body.get('question', '').strip()
        except Exception:
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)

        if not question:
            return JsonResponse({'error': 'question is required'}, status=400)

        # Load investment profile for context
        profile = {}
        try:
            p = user.profile
            profile = {
                'risk_tolerance': p.risk_tolerance,
                'budget': str(p.budget),
                'sectors': p.sectors or [],
                'time_horizon': p.time_horizon,
                'investment_goal': p.investment_goal,
            }
        except Exception:
            pass

        # Fetch semantically relevant memory snippets
        memory_context = []
        try:
            from apps.memory.vector_store import VectorStoreService
            vs = VectorStoreService()
            memory_context = vs.query(str(user.id), question, n_results=3)
        except Exception as e:
            logger.warning(f"Memory retrieval skipped: {e}")

        def sse_stream():
            try:
                for chunk in stream_qa_answer(report, profile, memory_context, question):
                    if chunk:
                        yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            except Exception as e:
                logger.error(f"Q&A stream error: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

        response = StreamingHttpResponse(sse_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response
