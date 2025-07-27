from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

router = DefaultRouter()
router.register(r'offers', views.PublicOfferViewSet, basename='offers')

urlpatterns = [
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('me/', views.MeView.as_view(), name='me'),
    path('offers/draft/', views.OfferDraftView.as_view(), name='offer-draft'),
    path('', include(router.urls)),
]
