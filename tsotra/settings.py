"""
Django settings for the tsotra project.

Plateforme tsotra — stages non rémunérés et volontariat structuré.
"""

import os
from datetime import timedelta
from pathlib import Path

from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config(
    'DJANGO_SECRET_KEY',
    default='django-insecure-i89mj5xb(934-vgonp6$=08stgzue!$9@7!zsm8b#02-w63a08',
)

DEBUG = config('DJANGO_DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('DJANGO_ALLOWED_HOSTS', default='*', cast=Csv())


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',

    'gestion',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'tsotra.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'tsotra.wsgi.application'


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


AUTH_USER_MODEL = 'gestion.Recruiter'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Europe/Paris'
USE_I18N = True
USE_TZ = True


STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=12),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}


CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173',
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True


EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend',
)
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='no-reply@tsotra.local')


TSOTRA_APPLICATION_RATE_LIMIT_PER_OFFER_HOURS = 24
TSOTRA_APPLICATION_GLOBAL_LIMIT = 5
TSOTRA_APPLICATION_GLOBAL_WINDOW_HOURS = 24


# -----------------------------------------------------------------------------
# Mobile Money — publication payante d'une offre
# -----------------------------------------------------------------------------
TSOTRA_OFFER_PRICE_MGA = config('TSOTRA_OFFER_PRICE_MGA', default=10000, cast=int)
TSOTRA_PAYMENT_BASE_URL = config(
    'TSOTRA_PAYMENT_BASE_URL', default='http://127.0.0.1:8000'
)
# Secret partagé pour valider les webhooks en sandbox (entête X-Tsotra-Secret).
TSOTRA_PAYMENT_WEBHOOK_SECRET = config(
    'TSOTRA_PAYMENT_WEBHOOK_SECRET', default='change-me-in-prod'
)

TSOTRA_MVOLA = {
    'BASE_URL': config('MVOLA_BASE_URL', default='https://devapi.mvola.mg'),
    'CONSUMER_KEY': config('MVOLA_CONSUMER_KEY', default=''),
    'CONSUMER_SECRET': config('MVOLA_CONSUMER_SECRET', default=''),
    'PARTNER_MSISDN': config('MVOLA_PARTNER_MSISDN', default='0343500003'),
    'PARTNER_NAME': config('MVOLA_PARTNER_NAME', default='tsotra'),
}

TSOTRA_ORANGE = {
    'BASE_URL': config('ORANGE_BASE_URL', default='https://api.orange.com'),
    'AUTH_HEADER': config('ORANGE_AUTH_HEADER', default=''),  # ex: "Basic xxxxxx"
    'MERCHANT_KEY': config('ORANGE_MERCHANT_KEY', default=''),
    'RETURN_URL': config('ORANGE_RETURN_URL', default='http://localhost:5173/payment/success'),
    'CANCEL_URL': config('ORANGE_CANCEL_URL', default='http://localhost:5173/payment/cancel'),
}

TSOTRA_AIRTEL = {
    'BASE_URL': config('AIRTEL_BASE_URL', default='https://openapiuat.airtel.africa'),
    'CLIENT_ID': config('AIRTEL_CLIENT_ID', default=''),
    'CLIENT_SECRET': config('AIRTEL_CLIENT_SECRET', default=''),
    'COUNTRY': config('AIRTEL_COUNTRY', default='MG'),
    'CURRENCY': config('AIRTEL_CURRENCY', default='MGA'),
}
