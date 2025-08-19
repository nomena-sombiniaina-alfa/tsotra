from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .emails import notify_recruiter_of_application
from .models import Application, Offer, OfferReport
from .permissions import IsApplicationOfferOwner, IsOfferOwner
from .serializers import (
    ApplicationCreateSerializer,
    ApplicationDashboardSerializer,
    OfferDraftSerializer,
    OfferPublicSerializer,
    OfferReportSerializer,
    OfferWriteSerializer,
    RecruiterRegisterSerializer,
    RecruiterSerializer,
)
from .throttling import check_application_rate_limits

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
    search_fields = ['title', 'description_short', 'description_full', 'domain', 'location']
    ordering_fields = ['created_at']

    def get_queryset(self):
        return Offer.objects.filter(status=Offer.Status.PUBLISHED).select_related('recruiter')

    @action(detail=True, methods=['post'], url_path='apply',
            serializer_class=ApplicationCreateSerializer)
    def apply(self, request, pk=None):
        offer = get_object_or_404(
            Offer, pk=pk, status=Offer.Status.PUBLISHED
        )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        error = check_application_rate_limits(email=email, offer_id=offer.pk)
        if error:
            return Response({'detail': error}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        application = serializer.save(offer=offer)
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
