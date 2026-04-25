from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator

class SpaceUsernameValidator(RegexValidator):
    regex = r'^[\w.@+-\s]+$'
    message = "Enter a valid username. This value may contain only letters, numbers, spaces, and @/./+/-/_ characters."

class User(AbstractUser):
    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[SpaceUsernameValidator()],
        error_messages={
            "unique": "A user with that username already exists.",
        },
    )
    class Role(models.TextChoices):
        MERCHANT = 'merchant', 'Merchant'
        REVIEWER = 'reviewer', 'Reviewer'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.MERCHANT
    )
