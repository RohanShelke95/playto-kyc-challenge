from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
import json

from core.models import User

# Validators
def validate_file_size(value):
    limit = 5 * 1024 * 1024 # 5 MB
    if value.size > limit:
        raise ValidationError('File too large. Size should not exceed 5 MB.')

file_validators = [
    FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'png']),
    validate_file_size
]

class KYCSubmission(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SUBMITTED = 'submitted', 'Submitted'
        UNDER_REVIEW = 'under_review', 'Under Review'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        MORE_INFO_REQUESTED = 'more_info_requested', 'More Info Requested'

    merchant = models.OneToOneField(User, on_delete=models.CASCADE, related_name='kyc_submission')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    
    # Personal details
    personal_name = models.CharField(max_length=255, blank=True)
    personal_email = models.EmailField(blank=True)
    personal_phone = models.CharField(max_length=20, blank=True)
    
    # Business details
    business_name = models.CharField(max_length=255, blank=True)
    business_type = models.CharField(max_length=100, blank=True)
    expected_monthly_volume = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Documents
    pan_document = models.FileField(upload_to='documents/pan/', validators=file_validators, null=True, blank=True)
    aadhaar_document = models.FileField(upload_to='documents/aadhaar/', validators=file_validators, null=True, blank=True)
    bank_statement = models.FileField(upload_to='documents/bank/', validators=file_validators, null=True, blank=True)
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)



class NotificationEvent(models.Model):
    merchant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    event_type = models.CharField(max_length=50)
    payload = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
