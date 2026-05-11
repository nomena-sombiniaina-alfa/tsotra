"""Seed de données démo réaliste.

Crée 6 organisations recruteurs + 26 offres publiées (1 stage et 1 volontariat
par domaine), réparties sur les principales villes malgaches.

Usage::

    python manage.py seed_offers          # idempotent : ne recrée pas l'existant
    python manage.py seed_offers --reset  # vide d'abord les offres + recruteurs démo
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import Application, Offer, OfferReport, Payment, Recruiter

DEMO_PASSWORD = 'tsotra-demo-2026'

ORGS = [
    {
        'email': 'recrutement@smartmad.mg',
        'organization_name': 'SmartMad Digital',
    },
    {
        'email': 'contact@masolidaire.mg',
        'organization_name': 'Madagascar Solidaire',
    },
    {
        'email': 'rh@tanaecotours.mg',
        'organization_name': 'Tana Eco Tours',
    },
    {
        'email': 'jobs@ankenykely.mg',
        'organization_name': 'AnkenyKely Finance',
    },
    {
        'email': 'recrutement@madalogistics.mg',
        'organization_name': 'Mada Logistics Sarl',
    },
    {
        'email': 'redaction@tantely.mg',
        'organization_name': 'Tantely Médias',
    },
]

# ─── 13 offres de type Stage ────────────────────────────────────────────────
STAGE_OFFERS = [
    {
        'org': 'recrutement@smartmad.mg',
        'domain': 'Communication',
        'title': 'Stage assistant·e communication digitale',
        'description_full': (
            "SmartMad Digital, agence basée à Antananarivo, accompagne les "
            "PME malgaches dans leur présence en ligne. Nous cherchons un·e "
            "stagiaire pour épauler notre pôle communication sur les "
            "campagnes Facebook et Instagram de plusieurs marques locales."
        ),
        'tasks': (
            "- Rédiger des posts pour Facebook et Instagram\n"
            "- Programmer les publications avec Meta Business Suite\n"
            "- Suivre les statistiques d'engagement et préparer un bilan\n"
            "  hebdomadaire\n"
            "- Participer aux brainstormings créatifs"
        ),
        'requirements': (
            "Bonne plume en français, à l'aise avec les réseaux sociaux, "
            "curiosité pour le marketing local. Étudiant·e en communication, "
            "lettres ou domaine connexe."
        ),
        'duration': '3 mois',
        'mode': 'hybrid',
        'location': 'Lot IVK 28 Antanimena, Antananarivo 101',
    },
    {
        'org': 'recrutement@smartmad.mg',
        'domain': 'Marketing / Digital',
        'title': "Stage marketing digital — campagnes e-commerce",
        'description_full': (
            "Vous travaillerez sur la stratégie marketing de nos clients "
            "e-commerce malgaches (mode, artisanat, agro-alimentaire). "
            "L'enjeu : doubler leur visibilité organique en trois mois."
        ),
        'tasks': (
            "- Faire un audit SEO/SEA des sites clients\n"
            "- Lancer et suivre des campagnes Google Ads (budget < 200€)\n"
            "- Produire un rapport mensuel par client\n"
            "- Proposer une roadmap de croissance trimestrielle"
        ),
        'requirements': (
            "Connaissance des outils Google (Analytics, Ads, Search Console), "
            "esprit analytique, anglais lu écrit."
        ),
        'duration': '4 mois',
        'mode': 'hybrid',
        'location': 'Lot IVK 28 Antanimena, Antananarivo 101',
    },
    {
        'org': 'recrutement@smartmad.mg',
        'domain': 'Développement / Tech',
        'title': "Stage développeur·euse web (React + Django)",
        'description_full': (
            "Nous développons des plateformes SaaS pour des PME africaines. "
            "Vous intégrerez une équipe de 4 dev et contribuerez à un produit "
            "réellement utilisé en production."
        ),
        'tasks': (
            "- Implémenter des fonctionnalités côté React (TypeScript)\n"
            "- Écrire des endpoints Django REST Framework\n"
            "- Participer aux code reviews et au pair programming\n"
            "- Rédiger des tests Pytest"
        ),
        'requirements': (
            "Bases solides en JavaScript et Python. Au moins un projet React "
            "ou Django déjà mené (école, perso, autre stage). Git maîtrisé."
        ),
        'duration': '6 mois',
        'mode': 'remote',
        'location': '',
    },
    {
        'org': 'recrutement@smartmad.mg',
        'domain': 'Design / Graphisme',
        'title': "Stage designer·euse graphique — identité visuelle",
        'description_full': (
            "Renforcement de notre équipe créative sur des projets "
            "d'identité visuelle pour artisans et associations malgaches. "
            "Approche locale et bilingue (français/malagasy)."
        ),
        'tasks': (
            "- Créer logos, chartes graphiques, packaging\n"
            "- Décliner les chartes pour les supports digitaux\n"
            "- Réaliser des illustrations vectorielles\n"
            "- Présenter ses propositions aux clients"
        ),
        'requirements': (
            "Maîtrise de Figma et de la suite Adobe (Illustrator, Photoshop). "
            "Portfolio attendu."
        ),
        'duration': '3 mois',
        'mode': 'onsite',
        'location': 'Lot IVK 28 Antanimena, Antananarivo 101',
    },
    {
        'org': 'jobs@ankenykely.mg',
        'domain': 'Administration / Gestion',
        'title': "Stage assistant·e administration des ventes",
        'description_full': (
            "AnkenyKely Finance accompagne les PME sur leur gestion. "
            "Notre cabinet recherche un·e stagiaire pour épauler l'équipe "
            "administration sur le suivi des contrats clients."
        ),
        'tasks': (
            "- Rédiger les bons de commande et factures\n"
            "- Suivre les paiements et relancer les retards\n"
            "- Tenir à jour le tableau de bord des contrats\n"
            "- Archiver et numériser les pièces administratives"
        ),
        'requirements': '',  # optionnel
        'duration': '3 mois',
        'mode': 'onsite',
        'location': 'Immeuble Tana Water Front, Ambodivona, Antananarivo 101',
    },
    {
        'org': 'jobs@ankenykely.mg',
        'domain': 'Comptabilité / Finance',
        'title': "Stage comptable junior — assistance bilan",
        'description_full': (
            "Vous participerez aux travaux d'arrêté comptable de fin "
            "d'exercice de nos clients (PME et associations). Bonne occasion "
            "de découvrir la diversité du métier."
        ),
        'tasks': (
            "- Saisie des écritures comptables (Sage)\n"
            "- Rapprochements bancaires mensuels\n"
            "- Préparation des annexes du bilan\n"
            "- Vérification des pièces justificatives"
        ),
        'requirements': (
            "Étudiant·e en comptabilité (BAC+2 minimum). Notions de Sage ou "
            "logiciel équivalent appréciées."
        ),
        'duration': '4 mois',
        'mode': 'onsite',
        'location': 'Immeuble Tana Water Front, Ambodivona, Antananarivo 101',
    },
    {
        'org': 'jobs@ankenykely.mg',
        'domain': 'Ressources humaines',
        'title': "Stage assistant·e RH — recrutement & onboarding",
        'description_full': (
            "Vous appuierez notre RRH sur l'ensemble du cycle recrutement, "
            "de la diffusion d'annonce jusqu'à l'intégration des nouveaux "
            "collaborateurs."
        ),
        'tasks': (
            "- Rédiger et publier les annonces sur les job boards locaux\n"
            "- Pré-qualifier les candidatures\n"
            "- Organiser les entretiens (planning, convocation, retour)\n"
            "- Préparer les supports d'onboarding"
        ),
        'requirements': '',
        'duration': '3 mois',
        'mode': 'hybrid',
        'location': 'Immeuble Tana Water Front, Ambodivona, Antananarivo 101',
    },
    {
        'org': 'contact@masolidaire.mg',
        'domain': 'Éducation / Formation',
        'title': "Stage assistant·e pédagogique — cours du soir",
        'description_full': (
            "Madagascar Solidaire anime des cours du soir pour adultes en "
            "alphabétisation. Vous épaulerez les formateurs sur la "
            "préparation des cours et le suivi des apprenant·e·s."
        ),
        'tasks': (
            "- Concevoir des supports pédagogiques bilingues (FR/malagasy)\n"
            "- Animer des séances de soutien individuel\n"
            "- Suivre la progression des apprenant·e·s\n"
            "- Préparer une fin d'année festive"
        ),
        'requirements': (
            "Patience et sens pédagogique. Bilingue français/malagasy."
        ),
        'duration': '4 mois',
        'mode': 'onsite',
        'location': 'Ankazomanga Ouest, Antananarivo 101',
    },
    {
        'org': 'contact@masolidaire.mg',
        'domain': 'Santé / Social',
        'title': "Stage assistant·e santé publique — terrain",
        'description_full': (
            "Notre programme de prévention en santé maternelle et infantile "
            "intervient dans des villages des hauts plateaux. Nous "
            "cherchons un·e stagiaire pour appuyer la collecte de données."
        ),
        'tasks': (
            "- Mener des entretiens avec les familles bénéficiaires\n"
            "- Saisir les données dans Kobo Toolbox\n"
            "- Produire un rapport mensuel d'indicateurs\n"
            "- Participer aux séances de sensibilisation"
        ),
        'requirements': (
            "Étudiant·e en santé publique, sociologie ou anthropologie. "
            "Bonne aisance relationnelle, mobilité régionale."
        ),
        'duration': '6 mois',
        'mode': 'hybrid',
        'location': "Bureau régional, route d'Antsirabe RN7, Antsirabe 110",
    },
    {
        'org': 'rh@tanaecotours.mg',
        'domain': 'Environnement / Agriculture',
        'title': "Stage chargé·e d'études environnement — biodiversité",
        'description_full': (
            "Tana Eco Tours réalise des études d'impact pour ses circuits. "
            "Vous contribuerez à un inventaire faunistique dans la région "
            "d'Andasibe."
        ),
        'tasks': (
            "- Préparer le protocole d'inventaire\n"
            "- Participer aux observations de terrain (lémuriens, oiseaux)\n"
            "- Saisir et cartographier les données collectées\n"
            "- Co-rédiger le rapport final"
        ),
        'requirements': (
            "Étudiant·e en biologie, écologie ou gestion de l'environnement. "
            "Aisance avec QGIS appréciée."
        ),
        'duration': '4 mois',
        'mode': 'onsite',
        'location': 'Base écologique RN2, Andasibe-Mantadia 514',
    },
    {
        'org': 'rh@tanaecotours.mg',
        'domain': 'Tourisme / Hôtellerie',
        'title': "Stage assistant·e tourisme — produits sur mesure",
        'description_full': (
            "Nous concevons des circuits sur mesure pour des voyageurs "
            "internationaux. Vous appuierez les conseillers voyage sur la "
            "construction et le suivi des itinéraires."
        ),
        'tasks': (
            "- Construire des itinéraires sur mesure (logistique, "
            "  hébergements)\n"
            "- Préparer les devis détaillés\n"
            "- Coordonner avec les prestataires locaux\n"
            "- Suivre les retours d'expérience post-voyage"
        ),
        'requirements': (
            "Formation tourisme ou commerce international. Anglais "
            "obligatoire, autre langue (allemand, italien) appréciée."
        ),
        'duration': '6 mois',
        'mode': 'hybrid',
        'location': "Lot II J 134 Ankorondrano, Antananarivo 101",
    },
    {
        'org': 'recrutement@madalogistics.mg',
        'domain': 'Logistique',
        'title': "Stage logistique entrepôt — chaîne d'approvisionnement",
        'description_full': (
            "Mada Logistics gère la chaîne d'approvisionnement de plusieurs "
            "distributeurs nationaux. Le stage vise à optimiser la rotation "
            "des stocks d'un entrepôt de Toamasina."
        ),
        'tasks': (
            "- Analyser les flux d'entrée/sortie de l'entrepôt\n"
            "- Proposer un plan de réorganisation des zones de stockage\n"
            "- Mettre à jour les procédures de réception\n"
            "- Former les magasiniers aux nouveaux process"
        ),
        'requirements': (
            "Étudiant·e en supply chain ou logistique. Maîtrise d'Excel, "
            "esprit d'observation."
        ),
        'duration': '3 mois',
        'mode': 'onsite',
        'location': "Zone industrielle, port de Toamasina 501",
    },
    {
        'org': 'redaction@tantely.mg',
        'domain': 'Journalisme / Médias',
        'title': "Stage journaliste web — rubrique économie",
        'description_full': (
            "Tantely Médias couvre l'actualité économique malgache. "
            "Nous cherchons un·e stagiaire pour renforcer la rubrique "
            "économie de notre site et de notre newsletter."
        ),
        'tasks': (
            "- Réaliser des interviews d'acteurs économiques\n"
            "- Rédiger 2 à 3 articles web par semaine\n"
            "- Animer la newsletter hebdomadaire\n"
            "- Participer à la conférence de rédaction"
        ),
        'requirements': (
            "École de journalisme ou expérience équivalente. Curiosité pour "
            "l'économie malgache, capacité de synthèse."
        ),
        'duration': '4 mois',
        'mode': 'hybrid',
        'location': "Lot II R 14 Isoraka, Antananarivo 101",
    },
]

# ─── 13 offres de type Volontariat ──────────────────────────────────────────
VOLUNTEER_OFFERS = [
    {
        'org': 'redaction@tantely.mg',
        'domain': 'Communication',
        'title': "Volontariat — community management festival du livre",
        'description_full': (
            "Le Salon du livre de Tana ouvre en avril. Nous cherchons un·e "
            "volontaire pour animer ses réseaux sociaux pendant les 3 "
            "semaines de préparation et l'événement lui-même."
        ),
        'tasks': (
            "- Préparer le calendrier éditorial Facebook/Instagram\n"
            "- Couvrir l'événement en stories en temps réel\n"
            "- Modérer les commentaires et messages\n"
            "- Faire un bilan chiffré post-événement"
        ),
        'requirements': '',
        'duration': '1 mois',
        'mode': 'hybrid',
        'location': "Hôtel de Ville, Analakely, Antananarivo 101",
    },
    {
        'org': 'rh@tanaecotours.mg',
        'domain': 'Marketing / Digital',
        'title': "Volontariat — campagne marketing tourisme local",
        'description_full': (
            "Aide à lancer une campagne de communication pour valoriser "
            "les circuits éco-touristiques auprès du marché malgache."
        ),
        'tasks': (
            "- Analyser la concurrence locale\n"
            "- Proposer un angle de campagne adapté au marché national\n"
            "- Décliner les visuels sur les supports digitaux\n"
            "- Suivre les KPI de la campagne (clics, conversions)"
        ),
        'requirements': (
            "Connaissance des outils Meta Ads, sensibilité à la "
            "communication responsable."
        ),
        'duration': '2 mois',
        'mode': 'remote',
        'location': '',
    },
    {
        'org': 'recrutement@smartmad.mg',
        'domain': 'Développement / Tech',
        'title': "Volontariat — contribution open source civic-tech",
        'description_full': (
            "Nous maintenons un outil open source utilisé par des "
            "associations malgaches pour publier leurs comptes. Nous "
            "cherchons des volontaires pour corriger des bugs et améliorer "
            "la documentation."
        ),
        'tasks': (
            "- Picker des issues sur GitHub et les résoudre\n"
            "- Améliorer la documentation utilisateur\n"
            "- Participer aux revues de code\n"
            "- Aider à empaqueter une nouvelle release"
        ),
        'requirements': (
            "À l'aise avec Git, Python ou JavaScript. Curiosité pour "
            "l'open source."
        ),
        'duration': '3 mois',
        'mode': 'remote',
        'location': '',
    },
    {
        'org': 'redaction@tantely.mg',
        'domain': 'Design / Graphisme',
        'title': "Volontariat — design d'un rapport annuel associatif",
        'description_full': (
            "Mise en page et illustration du rapport annuel 2026 d'une "
            "association partenaire de Tantely Médias (~40 pages)."
        ),
        'tasks': (
            "- Recueillir les contenus auprès de l'asso\n"
            "- Proposer une maquette en deux variantes\n"
            "- Finaliser le rapport (PDF + version web)"
        ),
        'requirements': (
            "Aisance Affinity Publisher ou InDesign. Portfolio attendu."
        ),
        'duration': '2 semaines',
        'mode': 'remote',
        'location': '',
    },
    {
        'org': 'recrutement@madalogistics.mg',
        'domain': 'Administration / Gestion',
        'title': "Volontariat — saisie & classement des dossiers RH",
        'description_full': (
            "Mission ponctuelle pour rattraper le retard d'archivage des "
            "dossiers RH (numérisation et indexation)."
        ),
        'tasks': (
            "- Trier les dossiers physiques par année et par service\n"
            "- Numériser les pièces avec un scanner pro\n"
            "- Indexer les fichiers selon la nomenclature fournie"
        ),
        'requirements': '',
        'duration': '1 semaine',
        'mode': 'onsite',
        'location': "Zone industrielle, port de Toamasina 501",
    },
    {
        'org': 'contact@masolidaire.mg',
        'domain': 'Comptabilité / Finance',
        'title': "Volontariat — tenue de comptes d'une petite asso",
        'description_full': (
            "Une asso de quartier (~30 adhérent·e·s, budget annuel "
            "5 000 €) cherche un coup de main pour mettre à jour ses "
            "comptes 2025 et préparer son AG."
        ),
        'tasks': (
            "- Saisir les recettes/dépenses sur un tableur dédié\n"
            "- Produire le bilan et le compte de résultat simplifiés\n"
            "- Présenter les chiffres à l'AG (10 min)"
        ),
        'requirements': (
            "Formation comptable ou expérience associative. À l'aise avec "
            "Excel ou LibreOffice Calc."
        ),
        'duration': 'Quelques jours',
        'mode': 'hybrid',
        'location': "Ankazomanga Ouest, Antananarivo 101",
    },
    {
        'org': 'contact@masolidaire.mg',
        'domain': 'Ressources humaines',
        'title': "Volontariat — coordination des bénévoles d'un événement",
        'description_full': (
            "Pour notre forum annuel des associations (juin), nous "
            "cherchons un·e volontaire pour coordonner les ~40 bénévoles "
            "mobilisés pendant les 3 jours de l'événement."
        ),
        'tasks': (
            "- Planifier les plannings bénévoles (Doodle, tableur)\n"
            "- Animer la réunion de briefing\n"
            "- Être point de contact sur le terrain\n"
            "- Recueillir les retours post-événement"
        ),
        'requirements': '',
        'duration': '2 semaines',
        'mode': 'hybrid',
        'location': "Centre culturel CGM, Mahamasina, Antananarivo 101",
    },
    {
        'org': 'contact@masolidaire.mg',
        'domain': 'Éducation / Formation',
        'title': "Volontariat — soutien scolaire en mathématiques",
        'description_full': (
            "Madagascar Solidaire organise un programme de soutien "
            "scolaire les samedis. Nous cherchons des volontaires pour "
            "encadrer des élèves de collège en maths."
        ),
        'tasks': (
            "- Animer une séance de 2 h tous les samedis matin\n"
            "- Préparer des exercices différenciés selon les niveaux\n"
            "- Faire un retour aux familles toutes les 4 séances"
        ),
        'requirements': (
            "Niveau BAC+1 minimum en sciences. Pédagogie bienveillante."
        ),
        'duration': '3 mois',
        'mode': 'onsite',
        'location': "Lycée municipal d'Andohatapenaka, Antananarivo 101",
    },
    {
        'org': 'contact@masolidaire.mg',
        'domain': 'Santé / Social',
        'title': "Volontariat — sensibilisation santé sexuelle ados",
        'description_full': (
            "Animation d'ateliers de sensibilisation à la santé sexuelle "
            "pour des adolescent·e·s en milieu scolaire, en partenariat "
            "avec le ministère de la Santé."
        ),
        'tasks': (
            "- Co-animer les ateliers (groupes de 25 ados)\n"
            "- Distribuer et expliquer les supports pédagogiques\n"
            "- Faire un debriefing après chaque session\n"
            "- Contribuer à l'amélioration des supports"
        ),
        'requirements': (
            "Aisance à l'oral devant un groupe d'ados. Formation "
            "préalable assurée par l'asso."
        ),
        'duration': '2 mois',
        'mode': 'onsite',
        'location': "Établissements scolaires, Antananarivo et périphérie",
    },
    {
        'org': 'contact@masolidaire.mg',
        'domain': 'Environnement / Agriculture',
        'title': "Volontariat — reboisement RN7",
        'description_full': (
            "Week-end de reboisement d'un site dégradé le long de la RN7, "
            "avec une école partenaire. Logistique + plantation + "
            "communication sur place."
        ),
        'tasks': (
            "- Préparer les plants la veille\n"
            "- Encadrer les groupes d'élèves sur le site\n"
            "- Documenter l'action (photos, témoignages)\n"
            "- Participer au nettoyage de fin de journée"
        ),
        'requirements': '',
        'duration': 'Ponctuel (quelques heures)',
        'mode': 'onsite',
        'location': "Site de reboisement, PK 87 RN7, Ambatolampy 116",
    },
    {
        'org': 'rh@tanaecotours.mg',
        'domain': 'Tourisme / Hôtellerie',
        'title': "Volontariat — accueil festival Madajazzcar",
        'description_full': (
            "Le Madajazzcar revient en octobre. Nous cherchons des "
            "volontaires anglophones pour orienter les festivaliers "
            "internationaux."
        ),
        'tasks': (
            "- Accueillir le public à l'entrée des scènes\n"
            "- Renseigner sur les hébergements et restos partenaires\n"
            "- Aider à la billetterie le soir\n"
            "- Tenir le point info touristique"
        ),
        'requirements': (
            "Anglais courant obligatoire, autre langue appréciée."
        ),
        'duration': '1 semaine',
        'mode': 'onsite',
        'location': "Esplanade du CCESCA, Antanimena, Antananarivo 101",
    },
    {
        'org': 'contact@masolidaire.mg',
        'domain': 'Logistique',
        'title': "Volontariat — distribution de kits scolaires",
        'description_full': (
            "Distribution de 800 kits scolaires dans 5 écoles rurales "
            "avant la rentrée. Mission opérationnelle, sur deux jours."
        ),
        'tasks': (
            "- Préparer les kits dans nos locaux la veille\n"
            "- Charger le camion et accompagner la tournée\n"
            "- Distribuer et faire signer la fiche de remise\n"
            "- Rédiger le compte rendu logistique"
        ),
        'requirements': '',
        'duration': 'Quelques jours',
        'mode': 'onsite',
        'location': "Région Itasy, départ Ankazomanga Ouest, Antananarivo 101",
    },
    {
        'org': 'redaction@tantely.mg',
        'domain': 'Journalisme / Médias',
        'title': "Volontariat — rédaction blog associatif",
        'description_full': (
            "Rédaction mensuelle de billets de blog pour valoriser les "
            "actions d'une association partenaire. Un format de 600 mots "
            "par billet, deux par mois."
        ),
        'tasks': (
            "- Interviewer un·e bénéficiaire ou bénévole\n"
            "- Rédiger un billet structuré, photos à l'appui\n"
            "- Travailler avec l'asso pour la relecture\n"
            "- Publier sur leur site WordPress"
        ),
        'requirements': (
            "Plume soignée, sens de la narration humaine."
        ),
        'duration': '6 mois',
        'mode': 'remote',
        'location': '',
    },
]


class Command(BaseCommand):
    help = "Crée des recruteurs démo + 26 offres réalistes (1 stage et 1 volontariat par domaine)."

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true',
                            help="Supprime d'abord les recruteurs démo et leurs offres.")

    @transaction.atomic
    def handle(self, *args, **opts):
        if opts['reset']:
            self._reset()

        recruiters = self._ensure_recruiters()
        self._create_offers(recruiters, STAGE_OFFERS, Offer.Type.INTERNSHIP)
        self._create_offers(recruiters, VOLUNTEER_OFFERS, Offer.Type.VOLUNTEER)

        total_offers = Offer.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f"Seed terminé — {len(recruiters)} recruteurs, "
            f"{total_offers} offres en base."
        ))
        self.stdout.write(self.style.WARNING(
            f"Mot de passe démo pour les comptes recruteurs : {DEMO_PASSWORD}"
        ))

    def _reset(self):
        emails = [o['email'] for o in ORGS]
        Application.objects.filter(offer__recruiter__email__in=emails).delete()
        OfferReport.objects.filter(offer__recruiter__email__in=emails).delete()
        Payment.objects.filter(offer__recruiter__email__in=emails).delete()
        Offer.objects.filter(recruiter__email__in=emails).delete()
        Recruiter.objects.filter(email__in=emails).delete()
        self.stdout.write(self.style.NOTICE("Recruteurs démo et offres associées supprimés."))

    def _ensure_recruiters(self):
        recruiters = {}
        for org in ORGS:
            user, created = Recruiter.objects.get_or_create(
                email=org['email'],
                defaults={
                    'organization_name': org['organization_name'],
                    'role': Recruiter.Role.RECRUITER,
                },
            )
            if created:
                user.set_password(DEMO_PASSWORD)
                user.save(update_fields=['password'])
                self.stdout.write(f"  + recruteur créé : {user.email}")
            recruiters[org['email']] = user
        return recruiters

    def _create_offers(self, recruiters, offers, offer_type):
        for spec in offers:
            recruiter = recruiters[spec['org']]
            existing = Offer.objects.filter(
                recruiter=recruiter, title=spec['title']
            ).first()
            if existing:
                continue
            Offer.objects.create(
                recruiter=recruiter,
                type=offer_type,
                domain=spec['domain'],
                title=spec['title'],
                description_full=spec['description_full'],
                tasks=spec['tasks'],
                requirements=spec.get('requirements', ''),
                duration=spec['duration'],
                mode=spec['mode'],
                location=spec.get('location', ''),
                status=Offer.Status.PUBLISHED,
            )
            self.stdout.write(f"  + offre créée [{offer_type}] {spec['title']}")
