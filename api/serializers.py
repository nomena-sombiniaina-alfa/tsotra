from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Application, Offer

Recruiter = get_user_model()


class RecruiterRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = Recruiter
        fields = ('id', 'email', 'password', 'organization_name')

    def create(self, validated_data):
        return Recruiter.objects.create_user(**validated_data)


class RecruiterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recruiter
        fields = ('id', 'email', 'organization_name', 'created_at')
        read_only_fields = ('id', 'email', 'created_at')


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
            'description_short', 'description_full', 'tasks', 'requirements',
            'experience_required', 'experience_justification',
            'duration', 'location', 'mode', 'mode_display',
            'organization_name', 'contact_method',
            'status', 'created_at',
        )
        read_only_fields = fields


class OfferDraftSerializer(serializers.ModelSerializer):
    """Étape 1 — création d'un brouillon avant inscription."""

    class Meta:
        model = Offer
        fields = (
            'id', 'title', 'type', 'domain',
            'description_short', 'location',
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
            'description_short', 'description_full', 'tasks', 'requirements',
            'experience_required', 'experience_justification',
            'duration', 'location', 'mode', 'contact_method', 'status',
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
        if attrs.get('status') == Offer.Status.PUBLISHED:
            required = ['description_full', 'tasks', 'requirements', 'contact_method']
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
        read_only_fields = ('id', 'created_at')


class ApplicationDashboardSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Application
        fields = (
            'id', 'offer', 'email', 'message', 'cv',
            'status', 'status_display', 'created_at',
        )
        read_only_fields = ('id', 'offer', 'email', 'message', 'cv', 'created_at')
