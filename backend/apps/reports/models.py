import uuid
from django.db import models


class InvestmentReport(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reports')
    agent_run = models.OneToOneField(
        'agents.AgentRun', on_delete=models.CASCADE, related_name='report'
    )
    summary = models.TextField()
    full_report = models.TextField()
    tickers = models.JSONField(default=list)
    market_snapshot = models.JSONField(default=dict)
    confidence_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report for {self.user.username} ({self.created_at.date()})"
