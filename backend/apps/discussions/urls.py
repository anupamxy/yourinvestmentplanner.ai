from django.urls import path
from .views import RoomListCreateView, RoomDetailView, MessageListView

urlpatterns = [
    path('rooms/',                               RoomListCreateView.as_view(), name='room-list'),
    path('rooms/<slug:slug>/',                   RoomDetailView.as_view(),     name='room-detail'),
    path('rooms/<slug:room_slug>/messages/',     MessageListView.as_view(),    name='room-messages'),
]
