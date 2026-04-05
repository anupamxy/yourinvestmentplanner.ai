from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify

User = get_user_model()


class Room(models.Model):
    CATEGORIES = [
        ('general',      '💬 General'),
        ('stocks',       '📈 Stocks'),
        ('mutual_funds', '🏦 Mutual Funds'),
        ('crypto',       '₿ Crypto'),
        ('tax',          '📊 Tax & Planning'),
        ('goals',        '🎯 Financial Goals'),
    ]

    name        = models.CharField(max_length=100)
    slug        = models.SlugField(unique=True)
    category    = models.CharField(max_length=20, choices=CATEGORIES, default='general')
    description = models.TextField(blank=True)
    created_by  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_rooms')
    is_public   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['category', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Message(models.Model):
    room       = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    content    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.user.username}: {self.content[:50]}'
