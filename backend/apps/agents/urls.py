from django.urls import path
from .views import AgentRunCreateView, AgentRunListView, AgentRunDetailView, AgentRunStreamView

urlpatterns = [
    path('run/', AgentRunCreateView.as_view(), name='agent-run-create'),
    path('runs/', AgentRunListView.as_view(), name='agent-run-list'),
    path('runs/<uuid:run_id>/', AgentRunDetailView.as_view(), name='agent-run-detail'),
    path('runs/<uuid:run_id>/stream/', AgentRunStreamView.as_view(), name='agent-run-stream'),
]
