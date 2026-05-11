from django.conf import settings
from django.core.mail import send_mail


def notify_recruiter_of_application(application):
    offer = application.offer
    subject = f"[tsotra] Nouvelle candidature: {offer.title}"
    body = (
        f"Bonjour,\n\n"
        f"Vous avez reçu une candidature pour l'offre : {offer.title}\n"
        f"Type : {offer.get_type_display()}\n"
        f"Domaine : {offer.domain}\n\n"
        f"--- Candidat ---\n"
        f"Email : {application.email}\n\n"
        f"Message :\n{application.message}\n\n"
        f"Consultez votre dashboard pour gérer cette candidature."
    )
    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [application.offer.recruiter.email],
        fail_silently=True,
    )
