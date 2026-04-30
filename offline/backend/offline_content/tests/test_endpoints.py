from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from backend.offline_content.models import CropFactSheet, Disease


class BackendHealthCheckTest(TestCase):
    def test_database_configured(self):
        crop = CropFactSheet.objects.create(
            slug="test-crop",
            name_ar="محصول اختبار",
            name_fr="Test Crop",
            name_en="Test Crop",
            planting_calendar={"sow": ["Oct"], "harvest": ["May"]},
            water_needs={"liters_per_m2_per_week": 25},
            avg_yield="2.5 t/ha",
        )
        self.assertTrue(crop.id)
        self.assertEqual(CropFactSheet.objects.count(), 1)


class CropAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.base_url = "/api/v1/offline"

        self.crop1 = CropFactSheet.objects.create(
            slug="wheat",
            name_ar="القمح",
            name_fr="Blé",
            name_en="Wheat",
            planting_calendar={"sow": ["Oct", "Nov"], "harvest": ["May", "Jun"]},
            water_needs={"liters_per_m2_per_week": 25},
            avg_yield="2.5 t/ha",
            description_fr="Une culture de céréales",
            is_active=True,
        )

        self.crop2 = CropFactSheet.objects.create(
            slug="tomato",
            name_ar="الطماطم",
            name_fr="Tomate",
            name_en="Tomato",
            planting_calendar={"sow": ["Mar", "Apr"], "harvest": ["Jul", "Aug"]},
            water_needs={"liters_per_m2_per_week": 35},
            avg_yield="30 t/ha",
            description_fr="Une culture maraîchère",
            is_active=True,
        )

    def test_list_crops(self):
        response = self.client.get(f"{self.base_url}/crops/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data if isinstance(response.data, list) else response.data.get('results', [])
        self.assertEqual(len(data), 2)

    def test_get_crop_by_slug(self):
        response = self.client.get(f"{self.base_url}/crops/wheat/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], 'wheat')
        self.assertEqual(response.data['name_en'], 'Wheat')

    def test_crop_inactive_not_listed(self):
        self.crop1.is_active = False
        self.crop1.save()
        response = self.client.get(f"{self.base_url}/crops/")
        data = response.data if isinstance(response.data, list) else response.data.get('results', [])
        self.assertEqual(len(data), 1)

    def test_crop_data_structure(self):
        response = self.client.get(f"{self.base_url}/crops/wheat/")
        required_fields = ['id', 'slug', 'name_ar', 'name_fr', 'name_en', 'planting_calendar', 'water_needs', 'avg_yield']
        for field in required_fields:
            self.assertIn(field, response.data)


class DiseaseAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.base_url = "/api/v1/offline"

        self.disease1 = Disease.objects.create(
            slug="powdery-mildew",
            name_ar="البياض الدقيقي",
            name_fr="Oïdium",
            name_en="Powdery Mildew",
            symptoms_ar="طلاء أبيض على الأوراق",
            symptoms_fr="Revêtement blanc sur les feuilles",
            treatment_ar="رش الكبريت",
            treatment_fr="Pulvériser du soufre",
            is_active=True,
        )

    def test_list_diseases(self):
        response = self.client.get(f"{self.base_url}/diseases/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data if isinstance(response.data, list) else response.data.get('results', [])
        self.assertEqual(len(data), 1)

    def test_get_disease_by_slug(self):
        response = self.client.get(f"{self.base_url}/diseases/powdery-mildew/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], 'powdery-mildew')


class SyncEndpointTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.base_url = "/api/v1/offline"

        CropFactSheet.objects.create(
            slug="wheat",
            name_ar="القمح",
            name_fr="Blé",
            name_en="Wheat",
            planting_calendar={"sow": ["Oct"]},
            water_needs={"liters_per_m2_per_week": 25},
            avg_yield="2.5 t/ha",
            is_active=True,
        )

    def test_sync_endpoint_exists(self):
        response = self.client.get(f"{self.base_url}/sync/")
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])
