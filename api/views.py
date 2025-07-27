from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, mixins, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Offer
from .serializers import (
    OfferDraftSerializer,
    OfferPublicSerializer,
    RecruiterRegisterSerializer,
    RecruiterSerializer,
)

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


class OfferDraftView(APIView):
    """Étape 1 — validation des champs initiaux avant inscription."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OfferDraftSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
