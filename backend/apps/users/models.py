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


class LifeProfile(models.Model):
    MARITAL_CHOICES = [
        ('single', 'Single'),
        ('married', 'Married'),
        ('divorced', 'Divorced/Separated'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='life_profile')

    # Professional
    profession = models.CharField(max_length=200)
    employer = models.CharField(max_length=200, blank=True)
    monthly_salary = models.DecimalField(max_digits=12, decimal_places=2)
    years_of_experience = models.PositiveIntegerField(default=0)

    # Personal
    age = models.PositiveIntegerField(null=True, blank=True)
    city = models.CharField(max_length=100, blank=True)
    marital_status = models.CharField(max_length=20, choices=MARITAL_CHOICES, default='single')
    family_members = models.PositiveIntegerField(default=1)
    dependents = models.PositiveIntegerField(default=0)

    # Financial
    monthly_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    existing_savings = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    existing_loans = models.JSONField(default=list)   # [{type, emi_amount, remaining_months}]

    # Life Goals
    life_goals = models.JSONField(default=list)       # ['house','marriage','retirement','education','travel']
    goals_detail = models.JSONField(default=dict)     # {house:{budget,target_year}, ...}

    currency = models.CharField(max_length=3, default='INR')
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} life profile"
