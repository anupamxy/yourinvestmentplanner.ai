from rest_framework import serializers
from .models import InvestmentReport


class InvestmentReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestmentReport
        fields = (
            'id', 'agent_run_id', 'summary', 'full_report',
            'tickers', 'confidence_score', 'created_at',
        )
        read_only_fields = fields


class InvestmentReportListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views (excludes full_report and market_snapshot)."""
    class Meta:
        model = InvestmentReport
        fields = ('id', 'agent_run_id', 'summary', 'tickers', 'confidence_score', 'created_at')
