from django.urls import path
from .views import (
    MerchantKYCView, MerchantSubmitKYCView,
    ReviewerQueueView, ReviewerMetricsView,
    ReviewerKYCDetailView, ReviewerKYCTransitionView
)

urlpatterns = [
    path('merchant/', MerchantKYCView.as_view(), name='merchant-kyc'),
    path('merchant/submit/', MerchantSubmitKYCView.as_view(), name='merchant-submit'),
    path('reviewer/queue/', ReviewerQueueView.as_view(), name='reviewer-queue'),
    path('reviewer/metrics/', ReviewerMetricsView.as_view(), name='reviewer-metrics'),
    path('reviewer/submissions/<int:pk>/', ReviewerKYCDetailView.as_view(), name='reviewer-detail'),
    path('reviewer/submissions/<int:pk>/transition/', ReviewerKYCTransitionView.as_view(), name='reviewer-transition'),
]
