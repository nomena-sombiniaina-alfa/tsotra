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

const PAGE_SIZE = 20

export default function Offers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [offers, setOffers] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  useEffect(() => {
    setLoading(true)
    const params = Object.fromEntries(searchParams.entries())
    api.listOffers(params)
      .then(r => {
        setOffers(r.data.results ?? [])
        setCount(r.data.count ?? 0)
      })
      .finally(() => setLoading(false))
  }, [searchParams])

  function update(key, value) {
    const next = Object.fromEntries(searchParams.entries())
    if (value) next[key] = value
    else delete next[key]
    // Changement de filtre → on revient à la page 1.
    if (key !== 'page') delete next.page
    setSearchParams(next)
  }

  function goToPage(n) {
    if (n < 1 || n > totalPages || n === page) return
    update('page', n === 1 ? '' : String(n))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="section">
      <div className="container">
        <div className="kicker">Missions ouvertes</div>
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
          <>
            <div className="offers-grid">
              {offers.map(o => <OfferCard key={o.id} offer={o} />)}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              count={count}
              onChange={goToPage}
            />
          </>
        )}
      </div>
    </section>
  )
}

function Pagination({ page, totalPages, count, onChange }) {
  if (totalPages <= 1) return null

  // Construit la liste des numéros à afficher avec éventuellement des …
  const pages = pageNumbers(page, totalPages)
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, count)

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination-summary">
        {from}–{to} sur {count}
      </span>
      <div className="pagination-controls">
        <button type="button"
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => onChange(page - 1)}
                aria-label="Page précédente">
          ‹
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="pagination-gap">…</span>
          ) : (
            <button key={p} type="button"
                    className={`pagination-btn ${p === page ? 'active' : ''}`}
                    onClick={() => onChange(p)}
                    aria-current={p === page ? 'page' : undefined}>
              {p}
            </button>
          )
        )}
        <button type="button"
                className="pagination-btn"
                disabled={page >= totalPages}
                onClick={() => onChange(page + 1)}
                aria-label="Page suivante">
          ›
        </button>
      </div>
    </nav>
  )
}

function pageNumbers(current, total) {
  // Toujours 1 et le dernier ; les voisins du courant ; … pour les trous.
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

function OfferCard({ offer }) {
  return (
    <Link to={`/offers/${offer.id}`} className="card offer-card">
      <div className="meta">
        <span className={`badge badge-${offer.type === 'internship' ? 'internship' : 'volunteer'}`}>
          {offer.type_display}
        </span>
        <span className="badge badge-mode">{offer.mode_display}</span>
      </div>
      <h3>{offer.title}</h3>
      <div className="org">{offer.organization_name || 'Organisation'}</div>
    </Link>
  )
}
