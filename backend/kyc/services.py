from django.core.exceptions import ValidationError
from django.utils import timezone
from core.models import User
from kyc.models import KYCSubmission, NotificationEvent
import json

def can_transition(old_state, new_state):
    allowed_transitions = {
        KYCSubmission.Status.DRAFT: [KYCSubmission.Status.SUBMITTED],
        KYCSubmission.Status.SUBMITTED: [KYCSubmission.Status.UNDER_REVIEW],
        KYCSubmission.Status.UNDER_REVIEW: [KYCSubmission.Status.APPROVED, KYCSubmission.Status.REJECTED, KYCSubmission.Status.MORE_INFO_REQUESTED],
        KYCSubmission.Status.MORE_INFO_REQUESTED: [KYCSubmission.Status.SUBMITTED],
    }
    return new_state in allowed_transitions.get(old_state, [])

def transition_kyc(submission, new_state, user, reason=""):
    if not can_transition(submission.status, new_state):
        raise ValidationError(f"Illegal transition from {submission.status} to {new_state}.")

    # Check permissions
    if new_state in [KYCSubmission.Status.SUBMITTED]:
        if user.id != submission.merchant.id:
            raise ValidationError("Only the merchant can submit the KYC.")
    else:
        if user.role != User.Role.REVIEWER:
            raise ValidationError("Only reviewers can change this state.")

    old_state = submission.status
    submission.status = new_state
    
    if new_state == KYCSubmission.Status.SUBMITTED:
        submission.submitted_at = timezone.now()
        
    submission.save()
    
    NotificationEvent.objects.create(
        merchant=submission.merchant,
        event_type='STATE_CHANGED',
        payload=json.dumps({
            'old_state': old_state,
            'new_state': new_state,
            'reason': reason,
            'actor_id': user.id
        })
    )
    return submission
