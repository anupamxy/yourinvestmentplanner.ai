from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import MemoryEntry
from .serializers import MemoryEntrySerializer


class MemoryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        entries = MemoryEntry.objects.filter(user=request.user)
        return Response(MemoryEntrySerializer(entries, many=True).data)


class MemoryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            entry = MemoryEntry.objects.get(id=pk, user=request.user)
        except MemoryEntry.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Also remove from vector store
        try:
            from .vector_store import VectorStoreService
            VectorStoreService().delete(str(request.user.id), entry.embedding_id)
        except Exception:
            pass

        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
