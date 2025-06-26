from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class RecruiterManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, password, **extra_fields)


class Recruiter(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    organization_name = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = RecruiterManager()

    def __str__(self):
        return self.email


class Offer(models.Model):
    class Type(models.TextChoices):
        INTERNSHIP = 'internship', 'Stage'
        VOLUNTEER = 'volunteer', 'Volontariat'

    class Mode(models.TextChoices):
        REMOTE = 'remote', 'Remote'
        ONSITE = 'onsite', 'Sur site'
        HYBRID = 'hybrid', 'Hybride'

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Brouillon'
        PUBLISHED = 'published', 'Publié'
        CLOSED = 'closed', 'Fermé'
        REMOVED = 'removed', 'Retiré'

    recruiter = models.ForeignKey(
        Recruiter, on_delete=models.CASCADE, related_name='offers'
    )
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.INTERNSHIP)
    domain = models.CharField(max_length=120)
    description_short = models.CharField(max_length=300)
    description_full = models.TextField(blank=True)
    tasks = models.TextField(blank=True)
    requirements = models.TextField(blank=True)
    experience_required = models.PositiveSmallIntegerField(default=0)
    experience_justification = models.TextField(blank=True)
    duration = models.CharField(max_length=120, blank=True)
    location = models.CharField(max_length=200, blank=True)
    mode = models.CharField(max_length=20, choices=Mode.choices, default=Mode.ONSITE)
    contact_method = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    report_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_type_display()})"


class Application(models.Model):
    class Status(models.TextChoices):
        NEW = 'new', 'Nouveau'
        VIEWED = 'viewed', 'Vu'
        ARCHIVED = 'archived', 'Archivé'

    offer = models.ForeignKey(Offer, on_delete=models.CASCADE, related_name='applications')
    email = models.EmailField()
    message = models.TextField()
    cv = models.FileField(upload_to='cv/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['offer', 'email', 'created_at']),
            models.Index(fields=['email', 'created_at']),
        ]

    def __str__(self):
        return f"{self.email} → {self.offer_id}"


class OfferReport(models.Model):
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE, related_name='reports')
    reporter_email = models.EmailField(blank=True)
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report#{self.pk} on offer {self.offer_id}"
