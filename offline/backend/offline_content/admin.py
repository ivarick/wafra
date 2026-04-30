from django.contrib import admin

from .models import CropFactSheet, Disease


@admin.register(CropFactSheet)
class CropFactSheetAdmin(admin.ModelAdmin):
    list_display = (
        "name_fr",
        "name_ar",
        "slug",
        "avg_yield",
        "is_active",
        "updated_at",
    )
    list_filter = ("is_active",)
    search_fields = ("slug", "name_fr", "name_ar", "name_en")
    prepopulated_fields = {"slug": ("name_en",)}
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (
            "Identity",
            {"fields": ("slug", "name_fr", "name_ar", "name_en", "is_active")},
        ),
        (
            "Content",
            {
                "fields": (
                    "planting_calendar",
                    "water_needs",
                    "avg_yield",
                    "description_fr",
                    "description_ar",
                    "image_url",
                )
            },
        ),
        ("Meta", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(Disease)
class DiseaseAdmin(admin.ModelAdmin):
    list_display = ("name_fr", "name_ar", "slug", "severity", "is_active", "updated_at")
    list_filter = ("severity", "is_active")
    search_fields = ("slug", "name_fr", "name_ar", "name_en")
    filter_horizontal = ("affected_crops",)
    prepopulated_fields = {"slug": ("name_en",)}
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (
            "Identity",
            {"fields": ("slug", "name_fr", "name_ar", "name_en", "is_active")},
        ),
        (
            "Symptoms & treatment",
            {
                "fields": (
                    "symptoms_fr",
                    "symptoms_ar",
                    "treatment_fr",
                    "treatment_ar",
                    "prevention_fr",
                    "prevention_ar",
                ),
            },
        ),
        ("Classification", {"fields": ("severity", "affected_crops", "image_url")}),
        ("Meta", {"fields": ("created_at", "updated_at")}),
    )
