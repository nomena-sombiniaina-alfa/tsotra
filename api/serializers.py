from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Offer

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
