from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from .models import Application


def check_application_rate_limits(email: str, offer_id: int):
    """Renvoie un message d'erreur si l'email a déjà postulé récemment, sinon None."""
    now = timezone.now()

    per_offer_window = timedelta(
        hours=settings.TSOTRA_APPLICATION_RATE_LIMIT_PER_OFFER_HOURS
    )
    if Application.objects.filter(
        offer_id=offer_id,
        email__iexact=email,
        created_at__gte=now - per_offer_window,
    ).exists():
        return (
            "Vous avez déjà postulé à cette offre récemment. "
            "Réessayez dans 24h."
        )

    return None
