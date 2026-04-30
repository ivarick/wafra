from rest_framework import serializers

from .models import CropFactSheet, Disease


class CropFactSheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = CropFactSheet
        fields = [
            "id",
            "slug",
            "name_ar",
            "name_fr",
            "name_en",
            "planting_calendar",
            "water_needs",
            "avg_yield",
            "description_fr",
            "description_ar",
            "image_url",
            "updated_at",
        ]


class DiseaseSerializer(serializers.ModelSerializer):
    affected_crop_slugs = serializers.SerializerMethodField()

    class Meta:
        model = Disease
        fields = [
            "id",
            "slug",
            "name_ar",
            "name_fr",
            "name_en",
            "symptoms_fr",
            "symptoms_ar",
            "treatment_fr",
            "treatment_ar",
            "prevention_fr",
            "prevention_ar",
            "severity",
            "image_url",
            "affected_crop_slugs",
            "updated_at",
        ]

    def get_affected_crop_slugs(self, obj):
        return list(obj.affected_crops.values_list("slug", flat=True))
