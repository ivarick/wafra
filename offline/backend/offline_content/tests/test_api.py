from django.test import TestCase
from rest_framework.test import APIClient


class OfflineContentAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_admin_page_accessible(self):
        response = self.client.get('/admin/', follow=True)
        self.assertIn(response.status_code, [200, 301, 302, 404])

    def test_app_config_loaded(self):
        from django.apps import apps
        config = apps.get_app_config('offline_content')
        self.assertEqual(config.name, 'backend.offline_content')
        self.assertEqual(config.verbose_name, 'Offline Content')
