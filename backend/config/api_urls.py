from django.urls import path, include

urlpatterns = [
    path('auth/', include('core.urls')),
    path('kyc/', include('kyc.urls')),
]
