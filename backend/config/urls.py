from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/preferences/', include('apps.users.urls_preferences')),
    path('api/v1/life-profile/', include('apps.users.urls_life')),
    path('api/v1/agents/', include('apps.agents.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/memory/', include('apps.memory.urls')),
    path('api/v1/life-advisor/', include('apps.life_advisor.urls')),
    path('api/v1/portfolio/',   include('apps.portfolio.urls')),
    path('api/v1/discussions/', include('apps.discussions.urls')),
]
