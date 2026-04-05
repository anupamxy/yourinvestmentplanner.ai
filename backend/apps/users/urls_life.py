from django.urls import path
from .views import LifeProfileView

urlpatterns = [
    path('', LifeProfileView.as_view(), name='life-profile'),
]
