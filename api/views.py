import logging
import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .emails import notify_recruiter_of_application
from .models import Application, Offer, Payment
from .payments import get_provider
from .payments.base import ProviderError
from .permissions import IsApplicationOfferOwner, IsOfferOwner
from .serializers import (
    ApplicationCreateSerializer,
    ApplicationDashboardSerializer,
    CandidateRegisterSerializer,
    OfferDraftSerializer,
    OfferPublicSerializer,
    OfferReportSerializer,
    OfferWriteSerializer,
    PaymentInitiateSerializer,
    PaymentSerializer,
    RecruiterRegisterSerializer,
    RecruiterSerializer,
)
from .throttling import check_application_rate_limits

logger = logging.getLogger(__name__)

Recruiter = get_user_model()


def _tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RecruiterRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'user': RecruiterSerializer(user).data, **_tokens_for(user)},
            status=status.HTTP_201_CREATED,
        )


class RegisterCandidateView(APIView):
    """Inscription candidat — email + mot de passe uniquement."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CandidateRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'user': RecruiterSerializer(user).data, **_tokens_for(user)},
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(RecruiterSerializer(request.user).data)


class PublicOfferViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                         viewsets.GenericViewSet):
    """Lecture publique des offres publiées."""

    serializer_class = OfferPublicSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'domain', 'mode', 'experience_required']
    search_fields = ['title', 'description_full', 'domain', 'location']
    ordering_fields = ['created_at']

    def get_queryset(self):
        return Offer.objects.filter(status=Offer.Status.PUBLISHED).select_related('recruiter')

    @action(detail=True, methods=['post'], url_path='apply',
            serializer_class=ApplicationCreateSerializer,
            permission_classes=[IsAuthenticated])
    def apply(self, request, pk=None):
        offer = get_object_or_404(
            Offer, pk=pk, status=Offer.Status.PUBLISHED
        )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = request.user.email
        error = check_application_rate_limits(email=email, offer_id=offer.pk)
        if error:
            return Response({'detail': error}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        application = serializer.save(offer=offer, email=email)
        notify_recruiter_of_application(application)
        return Response(
            ApplicationCreateSerializer(application).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path='report',
            serializer_class=OfferReportSerializer)
    def report(self, request, pk=None):
        offer = get_object_or_404(Offer, pk=pk)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save(offer=offer)
        Offer.objects.filter(pk=offer.pk).update(report_count=offer.report_count + 1)
        return Response(
            OfferReportSerializer(report).data,
            status=status.HTTP_201_CREATED,
        )


class OfferDraftView(APIView):
    """Étape 1 — validation des champs initiaux avant inscription.

    Le client conserve ce brouillon côté frontend (localStorage),
    puis l'envoie via POST /me/offers/ une fois authentifié.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OfferDraftSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class MyOfferViewSet(viewsets.ModelViewSet):
    """Dashboard recruteur — CRUD sur ses propres offres."""

    serializer_class = OfferWriteSerializer
    permission_classes = [IsAuthenticated, IsOfferOwner]

    def get_queryset(self):
        return Offer.objects.filter(recruiter=self.request.user)

    def perform_create(self, serializer):
        serializer.save(recruiter=self.request.user)

    @action(detail=True, methods=['get'], url_path='applications',
            serializer_class=ApplicationDashboardSerializer)
    def applications(self, request, pk=None):
        offer = self.get_object()
        qs = offer.applications.all()
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(self.get_serializer(qs, many=True).data)


    @action(detail=True, methods=['post'], url_path='pay',
            serializer_class=PaymentInitiateSerializer)
    def pay(self, request, pk=None):
        """Initie un paiement Mobile Money pour publier cette offre."""
        offer = self.get_object()
        if offer.status == Offer.Status.PUBLISHED:
            return Response(
                {'detail': 'Cette offre est déjà publiée.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        required = ['description_full', 'tasks']
        missing = [f for f in required if not getattr(offer, f, None)]
        if missing:
            return Response(
                {f: "Champ requis pour publier." for f in missing},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        provider_name = serializer.validated_data['provider']
        msisdn = serializer.validated_data['msisdn']
        amount = settings.TSOTRA_OFFER_PRICE_MGA
        internal_ref = f'tsotra-{offer.pk}-{uuid.uuid4().hex[:10]}'

        with transaction.atomic():
            Payment.objects.filter(offer=offer).delete()
            payment = Payment.objects.create(
                offer=offer,
                provider=provider_name,
                amount_mga=amount,
                msisdn=msisdn,
                internal_reference=internal_ref,
                status=Payment.Status.PENDING,
            )
            offer.status = Offer.Status.PENDING_PAYMENT
            offer.save(update_fields=['status'])

        provider = get_provider(provider_name)
        callback_url = (
            f"{settings.TSOTRA_PAYMENT_BASE_URL}"
            f"/api/payments/webhook/{provider_name}/"
            f"?secret={settings.TSOTRA_PAYMENT_WEBHOOK_SECRET}"
        )
        try:
            result = provider.initiate(
                amount_mga=amount,
                msisdn=msisdn,
                internal_reference=internal_ref,
                description=f'tsotra offre #{offer.pk}',
                callback_url=callback_url,
            )
        except ProviderError as exc:
            payment.status = Payment.Status.FAILED
            payment.failure_reason = str(exc)[:255]
            payment.save(update_fields=['status', 'failure_reason'])
            logger.warning("Provider %s init failed: %s", provider_name, exc)
            return Response(
                {'detail': f'Échec initiation paiement: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        payment.provider_reference = result.provider_reference
        payment.raw_callback = result.raw
        payment.save(update_fields=['provider_reference', 'raw_callback'])

        return Response(
            {
                'payment': PaymentSerializer(payment).data,
                'instructions': result.instructions,
                'payment_url': result.payment_url,
            },
            status=status.HTTP_201_CREATED,
        )


class PaymentWebhookView(APIView):
    """Callback Mobile Money — appelé par MVola / Orange / Airtel."""

    permission_classes = [AllowAny]

    def post(self, request, provider_name):
        secret = request.query_params.get('secret') or request.headers.get(
            'X-Tsotra-Secret'
        )
        if secret != settings.TSOTRA_PAYMENT_WEBHOOK_SECRET:
            return Response(
                {'detail': 'Unauthorized webhook.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            provider = get_provider(provider_name)
        except ProviderError:
            return Response(
                {'detail': 'Provider inconnu.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        result = provider.parse_callback(request.data)
        payment = Payment.objects.filter(
            provider=provider_name,
            provider_reference=result.provider_reference,
        ).select_related('offer').first()
        if payment is None:
            logger.warning(
                "Webhook %s sans paiement local (ref=%s)",
                provider_name, result.provider_reference,
            )
            return Response(status=status.HTTP_404_NOT_FOUND)

        return self._apply_callback_result(payment, result)

    @staticmethod
    def _apply_callback_result(payment, result):
        if payment.status == Payment.Status.SUCCESS:
            # Idempotent: déjà traité, on ne refait rien
            return Response({'detail': 'already processed'})

        with transaction.atomic():
            payment.raw_callback = result.raw
            if result.success:
                payment.status = Payment.Status.SUCCESS
                payment.failure_reason = ''
                payment.save()
                Offer.objects.filter(pk=payment.offer_id).update(
                    status=Offer.Status.PUBLISHED
                )
            else:
                payment.status = Payment.Status.FAILED
                payment.failure_reason = result.failure_reason[:255]
                payment.save()
        return Response({'detail': 'ok', 'status': payment.status})


class PaymentSimulateView(APIView):
    """DEV ONLY — simule un callback provider (pour tester sans téléphone).

    POST /api/payments/<payment_id>/simulate/  body: {"success": true}
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not settings.DEBUG:
            return Response(
                {'detail': 'Simulation désactivée hors DEBUG.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        payment = get_object_or_404(
            Payment.objects.select_related('offer'), pk=pk
        )
        if payment.offer.recruiter_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)

        success = bool(request.data.get('success', True))
        from .payments.base import CallbackResult
        result = CallbackResult(
            provider_reference=payment.provider_reference or payment.internal_reference,
            success=success,
            failure_reason='' if success else 'simulated_failure',
            raw={'simulated': True, **(payment.raw_callback or {})},
        )
        return PaymentWebhookView._apply_callback_result(payment, result)


class MyApplicationsView(APIView):
    """Toutes les candidatures sur les offres du recruteur connecté."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Application.objects.filter(
            offer__recruiter=request.user
        ).select_related('offer')
        return Response(ApplicationDashboardSerializer(qs, many=True).data)


class ApplicationStatusView(APIView):
    """PATCH /api/applications/<id>/ — change le statut (recruteur propriétaire)."""

    permission_classes = [IsAuthenticated, IsApplicationOfferOwner]

    def patch(self, request, pk):
        application = get_object_or_404(Application, pk=pk)
        self.check_object_permissions(request, application)
        new_status = request.data.get('status')
        if new_status not in dict(Application.Status.choices):
            return Response(
                {'detail': 'Statut invalide.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        application.status = new_status
        application.save(update_fields=['status'])
        return Response(ApplicationDashboardSerializer(application).data)
