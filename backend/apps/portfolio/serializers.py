from rest_framework import serializers
from .models import PortfolioEntry


class PortfolioEntrySerializer(serializers.ModelSerializer):
    gain_loss        = serializers.SerializerMethodField()
    gain_loss_pct    = serializers.SerializerMethodField()

    class Meta:
        model  = PortfolioEntry
        fields = [
            'id', 'asset_name', 'asset_type', 'ticker',
            'quantity', 'buy_price', 'current_price',
            'invested_amount', 'current_value',
            'gain_loss', 'gain_loss_pct',
            'date', 'notes', 'currency',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'invested_amount', 'current_value', 'created_at', 'updated_at']

    def get_gain_loss(self, obj):
        if obj.current_value and obj.invested_amount:
            return float(obj.current_value) - float(obj.invested_amount)
        return 0

    def get_gain_loss_pct(self, obj):
        if obj.invested_amount and float(obj.invested_amount) > 0:
            gain = float(obj.current_value or 0) - float(obj.invested_amount)
            return round((gain / float(obj.invested_amount)) * 100, 2)
        return 0
