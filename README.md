# tsotra — API

Plateforme de stages non rémunérés et de volontariat structuré.

## Stack

- Django 5 + Django REST Framework + SimpleJWT
- SQLite pour le prototype, PostgreSQL prévu pour la prod
- Frontend React à venir

## Démarrage

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser  # accès /admin/
python manage.py runserver
```

## Endpoints clés

| Méthode | URL | Auth | Rôle |
|---|---|---|---|
| `POST` | `/api/auth/register/` | non | Inscription recruteur (renvoie JWT) |
| `POST` | `/api/auth/login/` | non | Login → access + refresh |
| `POST` | `/api/auth/refresh/` | non | Rafraîchit l'access token |
| `GET`  | `/api/offers/` | non | Liste publique des offres |
| `GET`  | `/api/offers/<id>/` | non | Détail offre |
| `POST` | `/api/offers/<id>/apply/` | non | Candidature (anonyme) |
| `POST` | `/api/offers/<id>/report/` | non | Signaler une offre |
| `POST` | `/api/offers/draft/` | non | Validation des champs initiaux |
| `GET/POST` | `/api/me/offers/` | oui | Mes offres (CRUD) |
| `GET`  | `/api/me/offers/<id>/applications/` | oui | Candidatures sur une offre |
| `PATCH` | `/api/applications/<id>/` | oui | Statut (`new`/`viewed`/`archived`) |

### Filtres sur `/api/offers/`

`?type=internship|volunteer` — `?domain=...` — `?mode=remote|onsite|hybrid`
— `?experience_required=0` — `?search=mot-clé` — `?ordering=-created_at`

## Anti-spam

- 1 candidature par couple `(email, offre)` toutes les 24h
- Maximum 5 candidatures globales par email sur 24h
- Réponse `429 Too Many Requests` si dépassement

## Modèle de données

- **Recruiter** — utilisateur recruteur (email, organization_name, password)
- **Offer** — `type` (`internship`/`volunteer`), `experience_required` (0 par
  défaut), `experience_justification` (obligatoire si > 0), `status`
  (`draft`/`published`/`closed`/`removed`)
- **Application** — candidature anonyme avec email, message, CV optionnel,
  statut (`new`/`viewed`/`archived`)
- **OfferReport** — signalement d'une offre par un visiteur
