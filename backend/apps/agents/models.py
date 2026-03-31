import uuid
from django.db import models


class AgentRun(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='agent_runs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Run {self.id} ({self.status})"


class AgentStepLog(models.Model):
    AGENT_NAMES = [
        ('market_data', 'Market Data Agent'),
        ('analysis', 'Analysis Agent'),
        ('memory', 'Memory Agent'),
        ('llm', 'LLM Agent'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    run = models.ForeignKey(AgentRun, on_delete=models.CASCADE, related_name='steps')
    agent_name = models.CharField(max_length=20, choices=AGENT_NAMES)
    status = models.CharField(max_length=20, default='running')
    output = models.JSONField(default=dict)
    duration_ms = models.IntegerField(default=0)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']
