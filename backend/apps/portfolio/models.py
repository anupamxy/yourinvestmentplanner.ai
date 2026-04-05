from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class PortfolioEntry(models.Model):
    ASSET_TYPES = [
        ('stock',       'Stock'),
        ('mutual_fund', 'Mutual Fund'),
        ('etf',         'ETF'),
        ('crypto',      'Cryptocurrency'),
        ('fd',          'Fixed Deposit'),
        ('gold',        'Gold'),
        ('ppf',         'PPF / NPS'),
        ('bonds',       'Bonds / Debt'),
        ('real_estate', 'Real Estate'),
        ('other',       'Other'),
    ]

    user            = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolio_entries')
    asset_name      = models.CharField(max_length=200)
    asset_type      = models.CharField(max_length=20, choices=ASSET_TYPES, default='stock')
    ticker          = models.CharField(max_length=30, blank=True)
    quantity        = models.DecimalField(max_digits=15, decimal_places=4, default=0)
    buy_price       = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_price   = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    invested_amount = models.DecimalField(max_digits=15, decimal_places=2)   # qty × buy_price
    current_value   = models.DecimalField(max_digits=15, decimal_places=2, default=0)   # qty × current_price
    date            = models.DateField()
    notes           = models.TextField(blank=True)
    currency        = models.CharField(max_length=3, default='INR')
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def save(self, *args, **kwargs):
        if self.quantity and self.buy_price:
            self.invested_amount = float(self.quantity) * float(self.buy_price)
        if self.quantity and self.current_price:
            self.current_value = float(self.quantity) * float(self.current_price)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.asset_name} ({self.user.username})'
