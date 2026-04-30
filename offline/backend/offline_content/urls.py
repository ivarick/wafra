from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CropFactSheetViewSet, DiseaseViewSet, OfflineSyncView

router = DefaultRouter()
router.register("crops", CropFactSheetViewSet, basename="crop")
router.register("diseases", DiseaseViewSet, basename="disease")

urlpatterns = [
    path("sync/", OfflineSyncView.as_view(), name="offline-sync"),
    path("", include(router.urls)),
]
