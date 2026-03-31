from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import InvestmentReport
from .serializers import InvestmentReportSerializer, InvestmentReportListSerializer


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
