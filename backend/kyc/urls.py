from django.urls import re_path
from .views import (
    MerchantKYCView, MerchantSubmitKYCView,
    ReviewerQueueView, ReviewerMetricsView,
    ReviewerKYCDetailView, ReviewerKYCTransitionView
)

urlpatterns = [
    re_path(r'^merchant/?$', MerchantKYCView.as_view(), name='merchant-kyc'),
    re_path(r'^merchant/submit/?$', MerchantSubmitKYCView.as_view(), name='merchant-submit'),
    re_path(r'^reviewer/queue/?$', ReviewerQueueView.as_view(), name='reviewer-queue'),
    re_path(r'^reviewer/metrics/?$', ReviewerMetricsView.as_view(), name='reviewer-metrics'),
    re_path(r'^reviewer/submissions/(?P<pk>\d+)/?$', ReviewerKYCDetailView.as_view(), name='reviewer-detail'),
    re_path(r'^reviewer/submissions/(?P<pk>\d+)/transition/?$', ReviewerKYCTransitionView.as_view(), name='reviewer-transition'),
]
