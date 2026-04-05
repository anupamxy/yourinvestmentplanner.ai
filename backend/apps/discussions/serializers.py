from rest_framework import serializers
from .models import Room, Message


class MessageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model  = Message
        fields = ['id', 'username', 'content', 'created_at']
        read_only_fields = ['id', 'username', 'created_at']


class RoomSerializer(serializers.ModelSerializer):
    message_count  = serializers.IntegerField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, default='')

    class Meta:
        model  = Room
        fields = ['id', 'name', 'slug', 'category', 'description',
                  'is_public', 'message_count', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']
