import os
import django
from django.utils import timezone
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User
from kyc.models import KYCSubmission
from rest_framework.authtoken.models import Token

def run():
    print("Clearing old data...")
    User.objects.all().delete()
    
    print("Creating Reviewer...")
    reviewer = User.objects.create_user(username="reviewer", password="password", role=User.Role.REVIEWER)
    Token.objects.get_or_create(user=reviewer)

    print("Creating Merchant 1 (Draft)...")
    merchant_draft = User.objects.create_user(username="merchant_draft", password="password", role=User.Role.MERCHANT)
    Token.objects.get_or_create(user=merchant_draft)
    
    sub1 = KYCSubmission.objects.create(
        merchant=merchant_draft,
        status=KYCSubmission.Status.DRAFT,
        personal_name="Draft User",
        business_name="Draft Business",
        expected_monthly_volume=5000
    )

    print("Creating Merchant 2 (Under Review & At risk)...")
    merchant_review = User.objects.create_user(username="merchant_review", password="password", role=User.Role.MERCHANT)
    Token.objects.get_or_create(user=merchant_review)
    
    sub2 = KYCSubmission.objects.create(
        merchant=merchant_review,
        status=KYCSubmission.Status.UNDER_REVIEW,
        personal_name="Review User",
        business_name="Review Business LTD",
        expected_monthly_volume=15000,
        submitted_at=timezone.now() - datetime.timedelta(hours=26)
    )
    
    # Adding a notification to test metrics
    from kyc.models import NotificationEvent
    import json
    NotificationEvent.objects.create(
        merchant=merchant_review,
        event_type="STATE_CHANGED",
        payload=json.dumps({"new_state": "submitted"})
    )

    print("Seed complete!")
    print("Reviewer Login: reviewer / password")
    print("Merchant Draft Login: merchant_draft / password")
    print("Merchant Under Review Login: merchant_review / password")

if __name__ == '__main__':
    run()
