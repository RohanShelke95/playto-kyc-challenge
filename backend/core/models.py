from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        MERCHANT = 'merchant', 'Merchant'
        REVIEWER = 'reviewer', 'Reviewer'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.MERCHANT
    )
