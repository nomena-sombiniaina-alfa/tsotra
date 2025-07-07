from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

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
