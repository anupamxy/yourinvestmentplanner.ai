from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Room, Message
from .serializers import RoomSerializer, MessageSerializer


class RoomListCreateView(generics.ListCreateAPIView):
    serializer_class   = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Count
        qs = Room.objects.annotate(message_count=Count('messages'))
        category = self.request.query_params.get('category')
        if category and category != 'all':
            qs = qs.filter(category=category)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class RoomDetailView(generics.RetrieveAPIView):
    serializer_class   = RoomSerializer
    permission_classes = [IsAuthenticated]
    lookup_field       = 'slug'

    def get_queryset(self):
        from django.db.models import Count
        return Room.objects.annotate(message_count=Count('messages'))


class MessageListView(generics.ListAPIView):
    """GET last 50 messages for a room."""
    serializer_class   = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_slug = self.kwargs['room_slug']
        return Message.objects.filter(room__slug=room_slug).order_by('-created_at')[:50]

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(reversed(list(qs)), many=True)
        return Response(serializer.data)
