from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import PortfolioEntry
from .serializers import PortfolioEntrySerializer
from django.db.models import Sum
import json
from datetime import date


class PortfolioListCreateView(generics.ListCreateAPIView):
    serializer_class   = PortfolioEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PortfolioEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PortfolioEntryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = PortfolioEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PortfolioEntry.objects.filter(user=self.request.user)


class PortfolioSummaryView(APIView):
    """GET — aggregate stats + chart data for the portfolio."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = PortfolioEntry.objects.filter(user=request.user)
        if not qs.exists():
            return Response({'entries': 0})

        total_invested   = float(qs.aggregate(t=Sum('invested_amount'))['t'] or 0)
        total_current    = float(qs.aggregate(t=Sum('current_value'))['t'] or 0)

        # Asset type allocation
        allocation = {}
        for entry in qs:
            key = entry.get_asset_type_display()
            allocation[key] = allocation.get(key, 0) + float(entry.invested_amount)

        # Monthly investment bar data (last 12 months)
        from collections import defaultdict
        monthly = defaultdict(float)
        for entry in qs:
            key = entry.date.strftime('%b %Y')
            monthly[key] += float(entry.invested_amount)

        # Sort months chronologically
        from dateutil.relativedelta import relativedelta
        months_data = []
        seen = set()
        for entry in qs.order_by('date'):
            key = entry.date.strftime('%b %Y')
            if key not in seen:
                seen.add(key)
                months_data.append({'month': key, 'amount': monthly[key]})

        return Response({
            'total_invested':   total_invested,
            'total_current':    total_current,
            'gain_loss':        total_current - total_invested,
            'gain_loss_pct':    round(((total_current - total_invested) / total_invested) * 100, 2) if total_invested else 0,
            'entries':          qs.count(),
            'allocation':       [{'name': k, 'value': round(v, 2)} for k, v in allocation.items()],
            'monthly':          months_data[-12:],  # last 12 months
        })
