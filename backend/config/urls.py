from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/preferences/', include('apps.users.urls_preferences')),
    path('api/v1/agents/', include('apps.agents.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/memory/', include('apps.memory.urls')),
]
