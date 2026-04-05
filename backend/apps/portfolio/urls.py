from django.urls import path
from .views import PortfolioListCreateView, PortfolioEntryDetailView, PortfolioSummaryView

urlpatterns = [
    path('',           PortfolioListCreateView.as_view(), name='portfolio-list'),
    path('summary/',   PortfolioSummaryView.as_view(),    name='portfolio-summary'),
    path('<int:pk>/',  PortfolioEntryDetailView.as_view(), name='portfolio-detail'),
]
