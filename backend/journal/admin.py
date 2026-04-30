from django.contrib import admin
from .models import FieldLog, WeatherAlert

admin.site.register(FieldLog)
# Register your models here.
admin.site.register(WeatherAlert)
