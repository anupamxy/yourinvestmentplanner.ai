from django.contrib import admin
from .models import AgentRun, AgentStepLog


class AgentStepLogInline(admin.TabularInline):
    model = AgentStepLog
    extra = 0
    readonly_fields = ('id', 'agent_name', 'status', 'output', 'duration_ms', 'timestamp')


@admin.register(AgentRun)
class AgentRunAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'created_at', 'completed_at')
    inlines = [AgentStepLogInline]
