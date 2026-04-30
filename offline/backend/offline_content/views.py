from datetime import datetime

from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CropFactSheet, Disease
from .serializers import CropFactSheetSerializer, DiseaseSerializer


class CropFactSheetViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = CropFactSheetSerializer
    queryset = CropFactSheet.objects.filter(is_active=True)
    lookup_field = "slug"


class DiseaseViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = DiseaseSerializer
    queryset = Disease.objects.filter(is_active=True)
    lookup_field = "slug"


class OfflineSyncView(APIView):
    def get(self, request):
        since_param = request.query_params.get("since")
        crops_qs = CropFactSheet.objects.filter(is_active=True)
        diseases_qs = Disease.objects.filter(is_active=True)

        if since_param:
            try:
                since_dt = datetime.fromisoformat(since_param.replace("Z", "+00:00"))
                crops_qs = crops_qs.filter(updated_at__gt=since_dt)
                diseases_qs = diseases_qs.filter(updated_at__gt=since_dt)
            except ValueError:
                pass

        return Response(
            {
                "server_time": timezone.now().isoformat(),
                "crops": CropFactSheetSerializer(crops_qs, many=True).data,
                "diseases": DiseaseSerializer(diseases_qs, many=True).data,
                "deleted_crop_slugs": [],
                "deleted_disease_slugs": [],
            }
        )
