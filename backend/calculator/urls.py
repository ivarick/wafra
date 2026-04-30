from django.urls import path
from .views import CalculateRequirementsView

urlpatterns = [
    path('calculate/', CalculateRequirementsView.as_view(), name='calculator-calculate'),
]