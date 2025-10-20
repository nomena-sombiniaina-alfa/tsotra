/**
 * Données des menus déroulants. Centralisées pour pouvoir
 * les réutiliser sur la home (catégories) et le header.
 */

export const STAGE_DOMAINS = {
  popular: [
    { label: 'Communication', hint: 'Posts, réseaux, écriture',
      to: '/offers?type=internship&search=communication' },
    { label: 'Informatique & web', hint: 'Dev, data, support',
      to: '/offers?type=internship&search=informatique' },
    { label: 'Marketing', hint: 'Stratégie, content, growth',
      to: '/offers?type=internship&search=marketing' },
    { label: 'Gestion & finance', hint: 'Compta, contrôle, audit',
      to: '/offers?type=internship&search=gestion' },
  ],
  metiers: [
    { label: 'Design & création', hint: 'UI, graphisme, vidéo',
      to: '/offers?type=internship&search=design' },
    { label: 'Journalisme & rédaction', hint: 'Édition, traduction',
      to: '/offers?type=internship&search=rédaction' },
    { label: 'Évènementiel', hint: 'Logistique, coordination',
      to: '/offers?type=internship&search=évènementiel' },
    { label: 'Ressources humaines', hint: 'Recrutement, paie',
      to: '/offers?type=internship&search=rh' },
  ],
  publics: [
    { label: 'Enseignement', hint: 'Soutien, médiation',
      to: '/offers?type=internship&search=enseignement' },
    { label: 'Santé & médecine', hint: 'Para-médical, recherche',
      to: '/offers?type=internship&search=santé' },
    { label: 'Tourisme & hôtellerie', hint: 'Accueil, voyage',
      to: '/offers?type=internship&search=tourisme' },
    { label: 'Droit & juriste', hint: 'Cabinet, association',
      to: '/offers?type=internship&search=droit' },
  ],
}

export const VOLUNTEER_TYPES = {
  thematiques: [
    { label: 'Humanitaire & social',  hint: 'Aide, terrain, écoute',
      to: '/offers?type=volunteer&search=humanitaire' },
    { label: 'Environnement',         hint: 'Écologie, sensibilisation',
      to: '/offers?type=volunteer&search=environnement' },
    { label: 'Éducation',             hint: 'Soutien scolaire, mentorat',
      to: '/offers?type=volunteer&search=éducation' },
    { label: 'Santé & prévention',    hint: 'Campagnes, présence',
      to: '/offers?type=volunteer&search=santé' },
  ],
  formats: [
    { label: 'Sport & culture',       hint: 'Animation, encadrement',
      to: '/offers?type=volunteer&search=sport' },
    { label: 'Évènementiel associatif', hint: 'Festivals, collectes',
      to: '/offers?type=volunteer&search=évènement' },
    { label: 'Communication associative', hint: 'Réseaux, contenus',
      to: '/offers?type=volunteer&search=communication' },
    { label: 'International & solidarité', hint: 'Mobilité, projets',
      to: '/offers?type=volunteer&search=international' },
  ],
  duree: [
    { label: 'Missions ponctuelles',  hint: 'Quelques jours',
      to: '/offers?type=volunteer&duration=ponctuel' },
    { label: 'Engagements réguliers', hint: 'Plusieurs mois',
      to: '/offers?type=volunteer' },
    { label: 'À distance',            hint: 'Depuis chez vous',
      to: '/offers?type=volunteer&mode=remote' },
    { label: 'Sur site',              hint: 'Présentiel local',
      to: '/offers?type=volunteer&mode=onsite' },
  ],
}

export const PROFILS = [
  { label: 'Lycéen·ne',              hint: 'Première expérience',
    to: '/offers?experience_required=0&search=lycée' },
  { label: 'Étudiant·e',             hint: 'Stage de cursus',
    to: '/offers?experience_required=0&type=internship' },
  { label: 'Reconversion',           hint: 'Découverte d\'un métier',
    to: '/offers?experience_required=0' },
  { label: 'Bénévole',               hint: 'Engagement associatif',
    to: '/offers?type=volunteer' },
  { label: 'Recruteur',              hint: 'Publier une mission',
    to: '/publish' },
  { label: 'Association',            hint: 'Trouver des bénévoles',
    to: '/publish' },
]
