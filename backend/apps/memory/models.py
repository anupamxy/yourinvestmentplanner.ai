import uuid
from django.db import models


class MemoryEntry(models.Model):
    ENTRY_TYPES = [
        ('preference', 'User Preference Snapshot'),
        ('recommendation', 'Past Recommendation'),
        ('market_event', 'Market Event'),
        ('interaction', 'User Interaction'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='memories')
    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPES)
    content = models.TextField()
    metadata = models.JSONField(default=dict)
    embedding_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', 'entry_type'])]

    def __str__(self):
        return f"{self.user.username} - {self.entry_type} ({self.created_at.date()})"
