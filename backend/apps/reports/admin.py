from django.contrib import admin
from .models import InvestmentReport


@admin.register(InvestmentReport)
class InvestmentReportAdmin(admin.ModelAdmin):
    list_display = ('user', 'tickers', 'confidence_score', 'created_at')
    readonly_fields = ('id', 'created_at', 'market_snapshot')
