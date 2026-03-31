from django.urls import path
from .views import MemoryListView, MemoryDetailView

urlpatterns = [
    path('entries/', MemoryListView.as_view(), name='memory-list'),
    path('entries/<uuid:pk>/', MemoryDetailView.as_view(), name='memory-detail'),
]
