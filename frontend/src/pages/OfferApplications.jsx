import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { api, auth } from '../api.js'

export default function OfferApplications() {
  if (!auth.isLogged()) return <Navigate to="/login" replace />

  const { id } = useParams()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    api.myOfferApplications(id)
      .then(r => setApps(r.data.results ?? []))
      .finally(() => setLoading(false))
  }
  useEffect(load, [id])

  async function setStatus(appId, status) {
    await api.setApplicationStatus(appId, status)
    load()
  }

  return (
    <section className="section">
      <div className="container">
        <Link to="/dashboard" className="back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Retour à mes missions
        </Link>
        <div className="kicker" style={{ marginTop: '1em' }}>Candidatures reçues</div>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--serif)', fontWeight: 600, marginBottom: '1.5em' }}>
          {apps.length || 'Aucune'} candidature{apps.length > 1 ? 's' : ''}
        </h1>

        {loading ? (
          <div className="empty">Chargement…</div>
        ) : apps.length === 0 ? (
          <div className="empty">Aucune candidature pour cette mission pour l'instant.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
            {apps.map(a => (
              <div key={a.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6em' }}>
                  <div>
                    <span className={`pill pill-${a.status}`}>{a.status_display}</span>
                    <h3 style={{ margin: '0.4em 0 0', color: 'var(--text)' }}>{a.email}</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Reçue le {new Date(a.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4em', flexWrap: 'wrap' }}>
                    {a.status !== 'viewed' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setStatus(a.id, 'viewed')}>
                        Marquer comme vue
                      </button>
                    )}
                    {a.status !== 'archived' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setStatus(a.id, 'archived')}>
                        Archiver
                      </button>
                    )}
                    <a className="btn btn-primary btn-sm" href={`mailto:${a.email}`}>Répondre</a>
                  </div>
                </div>
                <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.8em', color: 'var(--text-soft)' }}>{a.message}</p>
                {a.cv && (
                  <a href={a.cv} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ marginTop: '0.6em' }}>
                    Télécharger le CV
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
