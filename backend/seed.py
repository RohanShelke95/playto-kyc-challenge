import os
import django
from django.utils import timezone
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User
from kyc.models import KYCSubmission
from rest_framework.authtoken.models import Token

def get_or_create_user(username, password, role):
    user, created = User.objects.get_or_create(
        username=username,
        defaults={'role': role}
    )
    if created:
        user.set_password(password)
        user.save()
        print(f"  Created: {username}")
    else:
        print(f"  Already exists: {username}")
    Token.objects.get_or_create(user=user)
    return user

def run():
    print("=== Seeding database (idempotent) ===")

    reviewer = get_or_create_user("reviewer", "password", User.Role.REVIEWER)

    merchant_draft = get_or_create_user("merchant_draft", "password", User.Role.MERCHANT)
    sub1, created = KYCSubmission.objects.get_or_create(
        merchant=merchant_draft,
        defaults={
            'status': KYCSubmission.Status.DRAFT,
            'personal_name': 'Draft User',
            'business_name': 'Draft Business',
            'expected_monthly_volume': 5000
        }
    )
    if created:
        print("  Created KYC for merchant_draft (draft)")

    merchant_review = get_or_create_user("merchant_review", "password", User.Role.MERCHANT)
    sub2, created = KYCSubmission.objects.get_or_create(
        merchant=merchant_review,
        defaults={
            'status': KYCSubmission.Status.UNDER_REVIEW,
            'personal_name': 'Review User',
            'business_name': 'Review Business LTD',
            'expected_monthly_volume': 15000,
            'submitted_at': timezone.now() - datetime.timedelta(hours=26)
        }
    )
    if created:
        print("  Created KYC for merchant_review (under_review, at_risk)")

    print("=== Seed complete ===")
    print("  reviewer / password")
    print("  merchant_draft / password")
    print("  merchant_review / password")

if __name__ == '__main__':
    run()
