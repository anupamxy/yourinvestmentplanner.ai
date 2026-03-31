import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email or self.username


class InvestmentProfile(models.Model):
    RISK_CHOICES = [
        ('conservative', 'Conservative'),
        ('moderate', 'Moderate'),
        ('aggressive', 'Aggressive'),
    ]
    HORIZON_CHOICES = [
        ('short', 'Short-term (< 1 year)'),
        ('medium', 'Medium-term (1-5 years)'),
        ('long', 'Long-term (> 5 years)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    risk_tolerance = models.CharField(max_length=20, choices=RISK_CHOICES, default='moderate')
    sectors = models.JSONField(default=list)
    budget = models.DecimalField(max_digits=12, decimal_places=2)
    investment_goal = models.TextField()
    time_horizon = models.CharField(max_length=10, choices=HORIZON_CHOICES)
    currency = models.CharField(max_length=3, default='USD')
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} profile"
