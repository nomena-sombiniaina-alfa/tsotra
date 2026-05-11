"""URL routes for the tsotra API.

Public endpoints (no auth):
    /auth/register/  /auth/login/  /auth/refresh/
    /offers/  /offers/<id>/  /offers/<id>/apply/  /offers/draft/
    /payments/webhook/<provider>/   (callback Mobile Money, secret en query)

Recruiter endpoints (JWT required):
    /me/  /me/offers/  /me/offers/<id>/applications/
    /me/offers/<id>/pay/   (POST — initie un paiement Mobile Money)
    /me/applications/  /applications/<id>/   (PATCH status: new/viewed/archived)
    /payments/<id>/simulate/   (DEBUG only)
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

router = DefaultRouter()
router.register(r'offers', views.PublicOfferViewSet, basename='offers')
router.register(r'me/offers', views.MyOfferViewSet, basename='my-offers')

urlpatterns = [
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/register-candidate/', views.RegisterCandidateView.as_view(),
         name='register-candidate'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('me/', views.MeView.as_view(), name='me'),
    path('me/applications/', views.MyApplicationsView.as_view(), name='my-applications'),
    path('applications/<int:pk>/', views.ApplicationStatusView.as_view(),
         name='application-status'),
    path('offers/draft/', views.OfferDraftView.as_view(), name='offer-draft'),
    path('payments/webhook/<str:provider_name>/',
         views.PaymentWebhookView.as_view(), name='payment-webhook'),
    path('payments/<int:pk>/simulate/',
         views.PaymentSimulateView.as_view(), name='payment-simulate'),
    path('', include(router.urls)),
]
