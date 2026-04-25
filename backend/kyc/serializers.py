from rest_framework import serializers
from .models import KYCSubmission, NotificationEvent

class KYCSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCSubmission
        fields = '__all__'
        read_only_fields = ('merchant', 'status', 'created_at', 'updated_at', 'submitted_at')

class ReviewerKYCSubmissionSerializer(serializers.ModelSerializer):
    merchant_email = serializers.EmailField(source='merchant.email', read_only=True)
    is_at_risk = serializers.SerializerMethodField()

    class Meta:
        model = KYCSubmission
        fields = '__all__'

    def get_is_at_risk(self, obj):
        from django.utils import timezone
        import datetime
        if obj.status in [KYCSubmission.Status.SUBMITTED, KYCSubmission.Status.UNDER_REVIEW] and obj.submitted_at:
            return timezone.now() - obj.submitted_at > datetime.timedelta(hours=24)
        return False

class NotificationEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationEvent
        fields = '__all__'
