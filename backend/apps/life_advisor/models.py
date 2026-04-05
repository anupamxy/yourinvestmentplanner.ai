import uuid
from django.db import models


class LifeAdvisorRun(models.Model):
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('running',   'Running'),
        ('completed', 'Completed'),
        ('failed',    'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='life_advisor_runs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    report = models.JSONField(default=dict)          # structured JSON report from LLM
    web_sources = models.JSONField(default=list)     # snippets fetched during research
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"LifeAdvisorRun({self.user.username}, {self.status})"
