from django.db import models


class CropFactSheet(models.Model):
    slug = models.SlugField(unique=True)
    name_ar = models.CharField(max_length=200)
    name_fr = models.CharField(max_length=200)
    name_en = models.CharField(max_length=200)

    planting_calendar = models.JSONField(
        help_text="e.g. {'sow': ['Oct','Nov'], 'harvest': ['May','Jun']}"
    )
    water_needs = models.JSONField(
        help_text="e.g. {'liters_per_m2_per_week': 25, 'notes_fr': '...', 'notes_ar': '...'}"
    )
    avg_yield = models.CharField(max_length=120)
    description_fr = models.TextField(blank=True)
    description_ar = models.TextField(blank=True)
    image_url = models.URLField(blank=True)

    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name_fr"]

    def __str__(self):
        return self.name_fr


class Disease(models.Model):
    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    slug = models.SlugField(unique=True)
    name_ar = models.CharField(max_length=200)
    name_fr = models.CharField(max_length=200)
    name_en = models.CharField(max_length=200)

    symptoms_fr = models.TextField()
    symptoms_ar = models.TextField()
    treatment_fr = models.TextField()
    treatment_ar = models.TextField()
    prevention_fr = models.TextField(blank=True)
    prevention_ar = models.TextField(blank=True)

    affected_crops = models.ManyToManyField(
        CropFactSheet,
        related_name="common_diseases",
        blank=True,
    )
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="medium")
    image_url = models.URLField(blank=True)

    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name_fr"]

    def __str__(self):
        return self.name_fr
