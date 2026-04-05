import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = await self._auth()
        if not self.user:
            await self.close(code=4001)
            return

        self.room_slug  = self.scope['url_route']['kwargs']['room_slug']
        self.room_group = f'chat_{self.room_slug}'

        # Verify room exists
        if not await self._room_exists():
            await self.close(code=4004)
            return

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        # Announce join
        await self.channel_layer.group_send(self.room_group, {
            'type':     'chat_join',
            'username': self.user.username,
        })

    async def disconnect(self, code):
        if hasattr(self, 'room_group'):
            await self.channel_layer.group_send(self.room_group, {
                'type':     'chat_leave',
                'username': getattr(self, 'user', type('', (), {'username': 'someone'})()).username,
            })
            await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        try:
            data    = json.loads(text_data)
            content = data.get('content', '').strip()
        except (json.JSONDecodeError, AttributeError):
            return

        if not content or len(content) > 2000:
            return

        msg = await self._save_message(content)
        await self.channel_layer.group_send(self.room_group, {
            'type':      'chat_message',
            'id':        msg.id,
            'username':  self.user.username,
            'content':   content,
            'timestamp': msg.created_at.isoformat(),
        })

    # ── event handlers ──────────────────────────────────────────────────────

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type':      'message',
            'id':        event['id'],
            'username':  event['username'],
            'content':   event['content'],
            'timestamp': event['timestamp'],
        }))

    async def chat_join(self, event):
        await self.send(text_data=json.dumps({
            'type':     'join',
            'username': event['username'],
        }))

    async def chat_leave(self, event):
        await self.send(text_data=json.dumps({
            'type':     'leave',
            'username': event['username'],
        }))

    # ── helpers ─────────────────────────────────────────────────────────────

    @database_sync_to_async
    def _auth(self):
        from rest_framework_simplejwt.tokens import AccessToken
        from django.contrib.auth import get_user_model
        User = get_user_model()
        qs = self.scope.get('query_string', b'').decode()
        params = dict(p.split('=', 1) for p in qs.split('&') if '=' in p)
        raw = params.get('token', '')
        if not raw:
            return None
        try:
            tok = AccessToken(raw)
            return User.objects.get(id=tok['user_id'])
        except Exception:
            return None

    @database_sync_to_async
    def _room_exists(self):
        from .models import Room
        return Room.objects.filter(slug=self.room_slug).exists()

    @database_sync_to_async
    def _save_message(self, content):
        from .models import Room, Message
        room = Room.objects.get(slug=self.room_slug)
        return Message.objects.create(room=room, user=self.user, content=content)
