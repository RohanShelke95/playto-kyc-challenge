from django.contrib import admin
from .models import KYCSubmission, NotificationEvent

admin.site.register(KYCSubmission)
admin.site.register(NotificationEvent)
