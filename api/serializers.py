from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Application, Offer, OfferReport, Payment

Recruiter = get_user_model()


class RecruiterRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = Recruiter
        fields = ('id', 'email', 'password', 'organization_name')

    def create(self, validated_data):
        return Recruiter.objects.create_user(
            role=Recruiter.Role.RECRUITER, **validated_data
        )


class CandidateRegisterSerializer(serializers.ModelSerializer):
    """Inscription candidat — uniquement email + mot de passe."""
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = Recruiter
        fields = ('id', 'email', 'password')

    def create(self, validated_data):
        return Recruiter.objects.create_user(
            role=Recruiter.Role.CANDIDATE, **validated_data
        )


class RecruiterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recruiter
        fields = ('id', 'email', 'organization_name', 'role', 'created_at')
        read_only_fields = ('id', 'email', 'role', 'created_at')


class OfferPublicSerializer(serializers.ModelSerializer):
    """Serializer pour les candidats — masque les infos privées."""

    organization_name = serializers.CharField(
        source='recruiter.organization_name', read_only=True
    )
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    mode_display = serializers.CharField(source='get_mode_display', read_only=True)

    class Meta:
        model = Offer
        fields = (
            'id', 'title', 'type', 'type_display', 'domain',
            'description_full', 'tasks', 'requirements',
            'experience_required', 'experience_justification',
            'duration', 'location', 'mode', 'mode_display',
            'organization_name',
            'status', 'created_at',
        )
        read_only_fields = fields


class OfferDraftSerializer(serializers.ModelSerializer):
    """Étape 1 — création d'un brouillon avant inscription."""

    class Meta:
        model = Offer
        fields = (
            'id', 'title', 'type', 'domain', 'location',
        )

    def validate_type(self, value):
        if value not in (Offer.Type.INTERNSHIP, Offer.Type.VOLUNTEER):
            raise serializers.ValidationError("Type invalide.")
        return value


class OfferWriteSerializer(serializers.ModelSerializer):
    """Étape 3 — complétion de l'offre par le recruteur connecté."""

    class Meta:
        model = Offer
        fields = (
            'id', 'title', 'type', 'domain',
            'description_full', 'tasks', 'requirements',
            'experience_required', 'experience_justification',
            'duration', 'location', 'mode', 'status',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate(self, attrs):
        exp = attrs.get(
            'experience_required',
            getattr(self.instance, 'experience_required', 0),
        )
        justification = attrs.get(
            'experience_justification',
            getattr(self.instance, 'experience_justification', ''),
        )
        if exp and exp > 0 and not (justification and justification.strip()):
            raise serializers.ValidationError({
                'experience_justification': (
                    "Justification obligatoire dès que de l'expérience est requise."
                )
            })
        new_status = attrs.get('status')
        if new_status == Offer.Status.PUBLISHED:
            # Publication = via paiement Mobile Money réussi.
            raise serializers.ValidationError({
                'status': (
                    "La publication s'obtient après paiement réussi via "
                    "POST /me/offers/<id>/pay/."
                ),
            })
        if new_status == Offer.Status.PENDING_PAYMENT:
            raise serializers.ValidationError({
                'status': "Ce statut est géré automatiquement par le paiement.",
            })
        # Vérifie les champs requis avant d'autoriser un paiement.
        wants_pay = self.context.get('check_payable')
        if wants_pay:
            required = ['description_full', 'tasks']
            missing = [
                f for f in required
                if not (attrs.get(f) or getattr(self.instance, f, None))
            ]
            if missing:
                raise serializers.ValidationError({
                    f: "Champ requis pour publier." for f in missing
                })
        return attrs


class ApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ('id', 'email', 'message', 'cv', 'created_at')
        # email est injecté depuis le compte du candidat connecté côté vue.
        read_only_fields = ('id', 'email', 'created_at')


class ApplicationDashboardSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Application
        fields = (
            'id', 'offer', 'email', 'message', 'cv',
            'status', 'status_display', 'created_at',
        )
        read_only_fields = ('id', 'offer', 'email', 'message', 'cv', 'created_at')


class OfferReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfferReport
        fields = ('id', 'offer', 'reporter_email', 'reason', 'created_at')
        read_only_fields = ('id', 'offer', 'created_at')


class PaymentInitiateSerializer(serializers.Serializer):
    """Entrée — le recruteur choisit le provider et son numéro payeur."""

    provider = serializers.ChoiceField(choices=Payment.Provider.choices)
    msisdn = serializers.CharField(max_length=20)

    def validate_msisdn(self, value):
        cleaned = value.replace(' ', '').replace('+', '')
        if not cleaned.isdigit() or len(cleaned) < 9:
            raise serializers.ValidationError("Numéro Mobile Money invalide.")
        return cleaned


class PaymentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    provider_display = serializers.CharField(
        source='get_provider_display', read_only=True
    )

    class Meta:
        model = Payment
        fields = (
            'id', 'offer', 'provider', 'provider_display', 'amount_mga',
            'msisdn', 'internal_reference', 'provider_reference',
            'status', 'status_display', 'failure_reason',
            'created_at', 'updated_at',
        )
        read_only_fields = fields
