from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Application, Offer, OfferReport, Payment, Recruiter


@admin.register(Recruiter)
class RecruiterAdmin(UserAdmin):
    list_display = ('email', 'organization_name', 'is_active', 'is_staff', 'created_at')
    search_fields = ('email', 'organization_name')
    ordering = ('-created_at',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Profil', {'fields': ('organization_name',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser',
                                    'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'organization_name', 'password1', 'password2',
                       'is_active', 'is_staff'),
        }),
    )


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'domain', 'recruiter', 'status',
                    'experience_required', 'report_count', 'created_at')
    list_filter = ('type', 'status', 'mode', 'domain')
    search_fields = ('title', 'description_full', 'domain', 'location')
    autocomplete_fields = ('recruiter',)


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('email', 'offer', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('email', 'offer__title')


@admin.register(OfferReport)
class OfferReportAdmin(admin.ModelAdmin):
    list_display = ('offer', 'reporter_email', 'created_at')
    search_fields = ('offer__title', 'reporter_email')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('offer', 'provider', 'amount_mga', 'msisdn',
                    'status', 'created_at')
    list_filter = ('provider', 'status')
    search_fields = ('internal_reference', 'provider_reference', 'msisdn')
    readonly_fields = ('internal_reference', 'provider_reference',
                       'raw_callback', 'created_at', 'updated_at')
