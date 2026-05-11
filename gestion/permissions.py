from rest_framework import permissions


class IsOfferOwner(permissions.BasePermission):
    """Le recruteur ne peut modifier que ses propres offres."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.recruiter_id == getattr(request.user, 'id', None)


class IsApplicationOfferOwner(permissions.BasePermission):
    """Seul le recruteur propriétaire de l'offre voit/édite la candidature."""

    def has_object_permission(self, request, view, obj):
        return obj.offer.recruiter_id == getattr(request.user, 'id', None)
