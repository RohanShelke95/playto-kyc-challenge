from django.test import TestCase
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status
from core.models import User
from kyc.models import KYCSubmission
from .services import transition_kyc

class KYCStateMachineTests(TestCase):
    def setUp(self):
        self.merchant = User.objects.create_user(username="merchant", password="123", role=User.Role.MERCHANT)
        self.reviewer = User.objects.create_user(username="reviewer", password="123", role=User.Role.REVIEWER)
        self.submission = KYCSubmission.objects.create(merchant=self.merchant)

    def test_illegal_transition_directly_to_approved(self):
        self.assertEqual(self.submission.status, KYCSubmission.Status.DRAFT)
        
        # Test Model Level
        with self.assertRaises(ValidationError):
            transition_kyc(self.submission, KYCSubmission.Status.APPROVED, self.reviewer)

    def test_illegal_merchant_approval_API(self):
        # Move to submitted first properly
        transition_kyc(self.submission, KYCSubmission.Status.SUBMITTED, self.merchant)
        transition_kyc(self.submission, KYCSubmission.Status.UNDER_REVIEW, self.reviewer)
        
        client = APIClient()
        # Even if reviewer logs in
        client.force_authenticate(user=self.reviewer)
        
        # Try to transition to something weird or from already approved
        transition_kyc(self.submission, KYCSubmission.Status.APPROVED, self.reviewer)
        
        response = client.post(f'/api/v1/kyc/reviewer/submissions/{self.submission.id}/transition/', {
            'action': 'approve'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Illegal transition', response.data['error'])
