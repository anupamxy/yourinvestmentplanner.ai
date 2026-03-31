from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import InvestmentProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    has_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'has_profile', 'created_at')

    def get_has_profile(self, obj):
        return hasattr(obj, 'profile')


class InvestmentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestmentProfile
        fields = (
            'id', 'risk_tolerance', 'sectors', 'budget',
            'investment_goal', 'time_horizon', 'currency',
            'updated_at', 'created_at',
        )
        read_only_fields = ('id', 'updated_at', 'created_at')

    def validate_budget(self, value):
        if value <= 0:
            raise serializers.ValidationError("Budget must be a positive number.")
        return value

    def validate_sectors(self, value):
        allowed = {
            'technology', 'healthcare', 'finance', 'energy',
            'consumer', 'industrials', 'utilities', 'real_estate',
            'materials', 'communication',
        }
        for s in value:
            if s not in allowed:
                raise serializers.ValidationError(f"'{s}' is not a valid sector.")
        return value
