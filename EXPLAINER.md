# Playto KYC Challenge Explainer

Here are the details for how key features were implemented:

## 1. The State Machine
Our state machine lives completely isolated in a dedicated service file (`backend/kyc/services.py`) using two targeted functions to prevent any loose business logic from leaking into Views/Serializers:

```python
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

    # Check permissions and log events...
```
I prevent illegal transitions by checking `can_transition(old, new)`. An exception is bounded at the service level (`ValidationError`), making it impenetrable regardless of where this service is called. All API endpoints call `transition_kyc` explicitly.

## 2. The Upload
The file validation logic operates via Django's out-of-the-box `FileExtensionValidator` and a custom method combined to process sizes. If someone sends a 50 MB file, Django raises a `ValidationError` early during the form saving process because the file model specifically checks sizes before it touches disk permanents (rejecting it as early as the ORM validation block).

```python
def validate_file_size(value):
    limit = 5 * 1024 * 1024 # 5 MB
    if value.size > limit:
        raise ValidationError('File too large. Size should not exceed 5 MB.')

file_validators = [
    FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'png']),
    validate_file_size
]
```

## 3. The Queue
The Queue is filtered using DRF Generic APIViews, returning only items within the review lifecycle:
```python
class ReviewerQueueView(generics.ListAPIView):
    permission_classes = [IsReviewer]
    serializer_class = ReviewerKYCSubmissionSerializer

    def get_queryset(self):
        return KYCSubmission.objects.filter(
            status__in=[KYCSubmission.Status.SUBMITTED, KYCSubmission.Status.UNDER_REVIEW]
        ).order_by('submitted_at')
```

The SLA flag natively attaches as a property injected straight from the Serializer `MethodField` calculations:
```python
    def get_is_at_risk(self, obj):
        from django.utils import timezone
        import datetime
        if obj.status in [KYCSubmission.Status.SUBMITTED, KYCSubmission.Status.UNDER_REVIEW] and obj.submitted_at:
            return timezone.now() - obj.submitted_at > datetime.timedelta(hours=24)
        return False
```
This was created this way because dynamically generating flags in the serializer assures time accuracy, as caching flags into database fields runs the massive risk of keeping outdated Boolean markers waiting on periodic cron tasks.

## 4. The Auth
The authorization checks run by validating via DRF Session `IsAuthenticated` contexts paired with User ownership logic natively mapping to API Views.
For instance, in `MerchantKYCView`, a Merchant can simply *only* touch `KYCSubmissions` intrinsically attached to them:
```python
        submission, _ = KYCSubmission.objects.get_or_create(merchant=request.user)
```
For reviewer capabilities:
```python
class IsReviewer(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == User.Role.REVIEWER
```
This hard wall guarantees users accessing `kyc/reviewer/` directories are 100% designated `Reviewers`. Both conditions completely prevent merchants from sniffing lateral profiles.

## 5. The AI Audit
An AI tooling system generated a custom Django username validator to allow spaces in usernames:
```python
# AI Code:
class SpaceUsernameValidator(RegexValidator):
    regex = r'^[\w.@+-\s]+$'
    message = "Enter a valid username."
```
This looked completely fine at first glance. However, when I ran the application locally on Python 3.13, Django crashed internally with a `PatternError: bad character range +-\s at position 6` when attempting to register or login. 

I caught that in Python 3.13, the regex `+-\s` is interpreted as an invalid character range from `+` to `\s` (a character class). The AI mistakenly placed the hyphen in the middle of the bracket expression instead of at the end. I debugged the 500 error, caught the mistake, and replaced it with a safe regex:
```python
# My Fix:
class SpaceUsernameValidator(RegexValidator):
    regex = r'^[\w.@+\s-]+$'
```
This is a perfect example of why you cannot blindly trust AI-generated code without understanding the underlying syntax rules of the specific Python version you are running.
