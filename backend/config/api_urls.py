from django.urls import re_path, include

urlpatterns = [
    re_path(r'^auth/?', include('core.urls')),
    re_path(r'^kyc/?', include('kyc.urls')),
]
