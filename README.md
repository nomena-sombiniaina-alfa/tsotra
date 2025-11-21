# tsotra

> Plateforme web pour des **stages non rémunérés** et du **volontariat
> structuré**, accessibles dès la première expérience.

Pensé comme un outil simple et lisible : on cherche une mission, on lit ce
qu'il y a à faire, on postule. Pas de frais, pas d'intermédiaire, pas de
chasseur de tête.

## Règles fondamentales

- Uniquement non rémunéré — pas de bénévolat déguisé.
- Transparence obligatoire : tâches, durée, mode de travail explicités.
- Aucune expérience exigée par défaut. Toute exigence doit être justifiée
  par écrit dans l'annonce.
- Mise en relation directe : le recruteur reçoit la candidature par email.

## Stack

- **Backend** : Django 6 + Django REST Framework + SimpleJWT (auth recruteur)
- **Base** : SQLite pour le prototype, PostgreSQL prévu en production
- **Frontend** : React 19 + Vite, React Router, axios

## Démarrage

```bash
# Backend (avec conda)
conda create -n tsotra python=3.12 -y && conda activate tsotra
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend
conda install -n tsotra -c conda-forge nodejs=20 -y
cd frontend
npm install
npm run dev   # http://127.0.0.1:5173 — proxy /api → :8000
```

## Endpoints clés

| Méthode | URL | Auth | Rôle |
|---|---|---|---|
| `POST` | `/api/auth/register/` | non | Inscription recruteur |
| `POST` | `/api/auth/login/` | non | Login (JWT access + refresh) |
| `GET`  | `/api/offers/` | non | Liste des offres publiées |
| `POST` | `/api/offers/<id>/apply/` | non | Candidature anonyme |
| `GET/POST` | `/api/me/offers/` | oui | Mes missions (CRUD recruteur) |
| `GET`  | `/api/me/offers/<id>/applications/` | oui | Candidatures reçues |
| `PATCH` | `/api/applications/<id>/` | oui | Changer le statut d'une candidature |

Filtres : `?type=`, `?mode=`, `?experience_required=`, `?search=`, `?ordering=`.

## Design system

Le design system du projet est versionné dans `design-system/tsotra/MASTER.md`
(palette, typo, espacements, patterns). Il a été généré et persisté avec le
skill `ui-ux-pro-max` puis adapté à l'identité de la plateforme.

## Roadmap

- [x] API REST complète (offres, candidatures, signalement, dashboard)
- [x] Auth JWT, anti-spam (par offre + global)
- [x] Frontend React (homepage, liste, détail, publication, dashboard)
- [x] Thèmes clair/sombre, mega-menu header, responsive complet
- [ ] Modération via interface admin dédiée
- [ ] Backend email SMTP en production (SendGrid / Mailgun)
- [ ] Migration PostgreSQL
