from django.urls import re_path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    re_path(r'^ws/discussions/(?P<room_slug>[\w-]+)/$', ChatConsumer.as_asgi()),
]
