from django.urls import path
from .views import LifeAdvisorRunCreateView, LifeAdvisorStreamView, LifeAdvisorRunDetailView, LifeAdvisorHistoryView

urlpatterns = [
    path('run/',               LifeAdvisorRunCreateView.as_view(), name='life-advisor-run'),
    path('runs/',              LifeAdvisorHistoryView.as_view(),   name='life-advisor-history'),
    path('runs/<uuid:pk>/',    LifeAdvisorRunDetailView.as_view(), name='life-advisor-detail'),
    path('runs/<uuid:pk>/stream/', LifeAdvisorStreamView.as_view(), name='life-advisor-stream'),
]
