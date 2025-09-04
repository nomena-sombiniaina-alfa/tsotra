import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'

const TYPES = [
  { v: '', l: 'Tous les types' },
  { v: 'internship', l: 'Stage' },
  { v: 'volunteer', l: 'Volontariat' },
]
const MODES = [
  { v: '', l: 'Tous les modes' },
  { v: 'remote', l: 'À distance' },
  { v: 'onsite', l: 'Sur site' },
  { v: 'hybrid', l: 'Hybride' },
]

export default function Offers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = Object.fromEntries(searchParams.entries())
    api.listOffers(params)
      .then(r => setOffers(r.data.results ?? []))
      .finally(() => setLoading(false))
  }, [searchParams])

  function update(key, value) {
    const next = Object.fromEntries(searchParams.entries())
    if (value) next[key] = value
    else delete next[key]
    setSearchParams(next)
  }

  return (
    <section className="section">
      <div className="container">
        <div className="kicker">Missions ouvertes</div>
        <h2>{offers.length || 'Aucune'} mission{offers.length > 1 ? 's' : ''} en ligne</h2>
        <p className="lead" style={{ marginBottom: '1.5em' }}>
          Toutes les annonces sont non rémunérées et encadrées. Filtrez par type, mode ou expérience attendue.
        </p>

        <div className="toolbar">
          <input
            placeholder="Rechercher (titre, mots-clés, lieu)"
            value={searchParams.get('search') || ''}
            onChange={e => update('search', e.target.value)}
            aria-label="Recherche"
          />
          <select value={searchParams.get('type') || ''} onChange={e => update('type', e.target.value)} aria-label="Type">
            {TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
          <select value={searchParams.get('mode') || ''} onChange={e => update('mode', e.target.value)} aria-label="Mode de travail">
            {MODES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
          <select
            value={searchParams.get('experience_required') || ''}
            onChange={e => update('experience_required', e.target.value)}
            aria-label="Expérience attendue"
          >
            <option value="">Toutes expériences</option>
            <option value="0">Débutant·e accepté·e</option>
            <option value="1">Au moins 1 an</option>
          </select>
        </div>

        {loading ? (
          <div className="empty">Chargement…</div>
        ) : offers.length === 0 ? (
          <div className="empty">
            Aucune mission ne correspond à ces critères pour l'instant.
          </div>
        ) : (
          <div className="offers-grid">
            {offers.map(o => <OfferCard key={o.id} offer={o} />)}
          </div>
        )}
      </div>
    </section>
  )
}

function OfferCard({ offer }) {
  return (
    <Link to={`/offers/${offer.id}`} className="card offer-card">
      <div className="meta">
        <span className={`badge badge-${offer.type === 'internship' ? 'internship' : 'volunteer'}`}>
          {offer.type_display}
        </span>
        <span className="badge badge-mode">{offer.mode_display}</span>
        {offer.experience_required === 0 && (
          <span className="badge badge-debutant">Débutant·e bienvenu·e</span>
        )}
      </div>
      <h3>{offer.title}</h3>
      <div className="org">
        {offer.organization_name || 'Organisation'} · {offer.location || 'Lieu non précisé'}
      </div>
      <p className="summary">{offer.description_short}</p>
      <span className="arrow">
        Voir la mission
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
      </span>
    </Link>
  )
}
