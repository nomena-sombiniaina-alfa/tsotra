import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { api, auth } from '../api.js'

export default function Dashboard() {
  if (!auth.isLogged()) return <Navigate to="/login" replace />

  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const me = auth.user

  useEffect(() => {
    api.myOffers()
      .then(r => setOffers(r.data.results ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container dash-grid">
      <aside className="dash-aside">
        <div className="card" style={{ padding: '1.2em' }}>
          <strong style={{ color: 'var(--text)' }}>
            {me?.organization_name || 'Mon organisation'}
          </strong>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3em' }}>
            {me?.email}
          </div>
        </div>
        <nav className="menu">
          <Link to="/dashboard" className="active">Mes missions</Link>
          <Link to="/publish">Nouvelle mission</Link>
        </nav>
      </aside>

      <section>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5em', flexWrap: 'wrap', gap: '1em' }}>
          <div>
            <div className="kicker" style={{ marginBottom: '0.3em' }}>Espace recruteur</div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'var(--serif)', fontWeight: 600, margin: 0 }}>
              Mes missions
            </h1>
          </div>
          <Link to="/publish" className="btn btn-primary">+ Nouvelle mission</Link>
        </header>

        {loading ? (
          <div className="empty">Chargement…</div>
        ) : offers.length === 0 ? (
          <div className="empty">
            <p style={{ marginBottom: '1em' }}>Vous n'avez pas encore publié de mission.</p>
            <Link to="/publish" className="btn btn-primary">Publier ma première mission</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
            {offers.map(o => (
              <div key={o.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1em', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <span className={`pill pill-${o.status === 'published' ? 'published' : 'draft'}`}>
                      {o.status === 'published' ? 'En ligne' : 'Brouillon'}
                    </span>
                    <h3 style={{ marginTop: '0.5em', marginBottom: '0.2em', color: 'var(--text)' }}>
                      {o.title}
                    </h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {o.type === 'internship' ? 'Stage' : 'Volontariat'} · {o.domain}
                      {o.location ? ` · ${o.location}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap' }}>
                    <Link to={`/offers/${o.id}`} className="btn btn-ghost btn-sm">Voir l'annonce</Link>
                    <Link to={`/dashboard/offers/${o.id}/applications`} className="btn btn-primary btn-sm">
                      Candidatures
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
