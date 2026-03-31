from rest_framework import serializers
from .models import AgentRun, AgentStepLog


class AgentStepLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentStepLog
        fields = ('id', 'agent_name', 'status', 'output', 'duration_ms', 'timestamp')


class AgentRunSerializer(serializers.ModelSerializer):
    steps = AgentStepLogSerializer(many=True, read_only=True)

    class Meta:
        model = AgentRun
        fields = ('id', 'status', 'created_at', 'completed_at', 'error_message', 'steps')
