from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import KYCSubmission, NotificationEvent
from core.models import User
from .serializers import KYCSubmissionSerializer, ReviewerKYCSubmissionSerializer
from django.utils import timezone
import datetime
from .services import transition_kyc

class IsReviewer(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == User.Role.REVIEWER

class MerchantKYCView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        submission, _ = KYCSubmission.objects.get_or_create(merchant=request.user)
        serializer = KYCSubmissionSerializer(submission)
        return Response(serializer.data)

    def put(self, request):
        submission, _ = KYCSubmission.objects.get_or_create(merchant=request.user)
        if submission.status in [KYCSubmission.Status.SUBMITTED, KYCSubmission.Status.UNDER_REVIEW, KYCSubmission.Status.APPROVED, KYCSubmission.Status.REJECTED]:
            return Response({"error": "Cannot edit submission in current state."}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = KYCSubmissionSerializer(submission, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class MerchantSubmitKYCView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        submission = KYCSubmission.objects.get(merchant=request.user)
        try:
            transition_kyc(submission, KYCSubmission.Status.SUBMITTED, request.user)
            return Response(KYCSubmissionSerializer(submission).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ReviewerQueueView(generics.ListAPIView):
    permission_classes = [IsReviewer]
    serializer_class = ReviewerKYCSubmissionSerializer

    def get_queryset(self):
        return KYCSubmission.objects.filter(
            status__in=[KYCSubmission.Status.SUBMITTED, KYCSubmission.Status.UNDER_REVIEW]
        ).order_by('submitted_at')

class ReviewerMetricsView(APIView):
    permission_classes = [IsReviewer]

    def get(self, request):
        active_submissions = KYCSubmission.objects.filter(status__in=[KYCSubmission.Status.SUBMITTED, KYCSubmission.Status.UNDER_REVIEW])
        queue_count = active_submissions.count()

        # Avg time in queue for current submissions
        now = timezone.now()
        total_seconds = sum([(now - s.submitted_at).total_seconds() for s in active_submissions if s.submitted_at])
        avg_time = (total_seconds / queue_count) if queue_count > 0 else 0

        # Approval rate 7 days
        seven_days_ago = now - datetime.timedelta(days=7)
        recent_events = NotificationEvent.objects.filter(timestamp__gte=seven_days_ago, event_type='STATE_CHANGED')
        approved_count = 0
        total_decisions = 0
        for event in recent_events:
            if isinstance(event.payload, str):
                import json
                payload = json.loads(event.payload)
            else:
                payload = event.payload
            
            new_state = payload.get('new_state')
            if new_state in [KYCSubmission.Status.APPROVED, KYCSubmission.Status.REJECTED]:
                total_decisions += 1
                if new_state == KYCSubmission.Status.APPROVED:
                    approved_count += 1
        
        approval_rate = (approved_count / total_decisions * 100) if total_decisions > 0 else 0

        return Response({
            "queue_count": queue_count,
            "avg_time_seconds": avg_time,
            "approval_rate_7d": approval_rate
        })

class ReviewerKYCDetailView(generics.RetrieveAPIView):
    permission_classes = [IsReviewer]
    queryset = KYCSubmission.objects.all()
    serializer_class = ReviewerKYCSubmissionSerializer

class ReviewerKYCTransitionView(APIView):
    permission_classes = [IsReviewer]

    def post(self, request, pk):
        try:
            submission = KYCSubmission.objects.get(pk=pk)
        except KYCSubmission.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action') # approve, reject, request_info
        reason = request.data.get('reason', '')

        action_map = {
            'approve': KYCSubmission.Status.APPROVED,
            'reject': KYCSubmission.Status.REJECTED,
            'request_info': KYCSubmission.Status.MORE_INFO_REQUESTED
        }

        if action not in action_map:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transition_kyc(submission, action_map[action], request.user, reason)
            return Response(ReviewerKYCSubmissionSerializer(submission).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
