import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, auth, flatErrors } from '../api.js'

export default function OfferDetail() {
  const { id } = useParams()
  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getOffer(id)
      .then(r => setOffer(r.data))
      .catch(() => setOffer(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="container section"><div className="empty">Chargement…</div></div>
  if (!offer) return (
    <div className="container section">
      <div className="empty">
        Cette mission n'existe pas ou a été retirée.{' '}
        <Link to="/offers">Retour à la liste</Link>
      </div>
    </div>
  )

  return (
    <>
      <header className="detail-header">
        <div className="container">
          <Link to="/offers" className="back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Toutes les missions
          </Link>
          <div className="meta">
            <span className={`badge badge-${offer.type === 'internship' ? 'internship' : 'volunteer'}`}>
              {offer.type_display}
            </span>
            <span className="badge badge-mode">{offer.mode_display}</span>
            {offer.experience_required === 0 ? (
              <span className="badge badge-debutant">Aucune expérience exigée</span>
            ) : (
              <span className="badge badge-exp">Au moins {offer.experience_required} an(s)</span>
            )}
          </div>
          <h1>{offer.title}</h1>
          <div className="subline">
            {offer.organization_name || 'Organisation'} · {offer.domain}
            {offer.location ? ` · ${offer.location}` : ''}
            {offer.duration ? ` · ${offer.duration}` : ''}
          </div>
        </div>
      </header>

      <div className="container">
        <div className="detail-grid">
          <article>
            <h2>Présentation de la mission</h2>
            <p>{offer.description_full}</p>

            {offer.tasks && (<>
              <h2>Tâches concrètes</h2>
              <p>{offer.tasks}</p>
            </>)}

            {offer.requirements && (<>
              <h2>Profil recherché</h2>
              <p>{offer.requirements}</p>
            </>)}

            {offer.experience_required > 0 && offer.experience_justification && (<>
              <h2>Pourquoi de l'expérience est demandée</h2>
              <div className="justification-box">
                <p style={{ margin: 0 }}>{offer.experience_justification}</p>
              </div>
            </>)}
          </article>

          <aside>
            <ApplyOrRegister offerId={offer.id} />
          </aside>
        </div>
      </div>
    </>
  )
}

function ApplyOrRegister({ offerId }) {
  const [logged, setLogged] = useState(auth.isLogged())
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className="apply-box">
      {toast && <Toast message={toast.message} kind={toast.kind} />}
      {logged ? (
        <ApplyForm offerId={offerId} userEmail={auth.user?.email} />
      ) : (
        <CandidateRegister onSuccess={() => {
          setLogged(true)
          setToast({ message: 'Inscription réussie ! Vous pouvez maintenant postuler.', kind: 'success' })
        }} />
      )}
    </div>
  )
}

function CandidateRegister({ onSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrors([])
    try {
      const r = await api.registerCandidate(form)
      auth.set(r.data)
      onSuccess()
    } catch (err) {
      setErrors(flatErrors(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h3>Créer un compte pour postuler</h3>
      <p className="small">
        Inscription rapide — juste un email et un mot de passe.
      </p>
      {errors.length > 0 && (
        <div className="alert alert-error">
          {errors.map((m, i) => <div key={i}>{m}</div>)}
        </div>
      )}
      <form onSubmit={submit}>
        <div className="field">
          <label>Email *</label>
          <input type="email" required autoComplete="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="vous@exemple.com" />
        </div>
        <div className="field">
          <label>Mot de passe *</label>
          <input type="password" required minLength={8} autoComplete="new-password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Au moins 8 caractères" />
        </div>
        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      <p className="small" style={{ marginTop: '0.8em' }}>
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </>
  )
}

function ApplyForm({ offerId, userEmail }) {
  const [message, setMessage] = useState('')
  const [cv, setCv] = useState(null)
  const [status, setStatus] = useState({ kind: null, msgs: [] })
  const [submitting, setSubmitting] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setStatus({ kind: null, msgs: [] })
    try {
      await api.applyToOffer(offerId, { message, cv })
      setStatus({ kind: 'success', msgs: ['Candidature envoyée. Le recruteur reçoit votre message par email.'] })
      setMessage('')
      setCv(null)
    } catch (err) {
      setStatus({ kind: 'error', msgs: flatErrors(err) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h3>Postuler à cette mission</h3>
      {userEmail && (
        <p className="small">Connecté en tant que <strong>{userEmail}</strong>.</p>
      )}

      {status.kind === 'success' && <div className="alert alert-success">{status.msgs[0]}</div>}
      {status.kind === 'error' && (
        <div className="alert alert-error">
          {status.msgs.map((m, i) => <div key={i}>{m}</div>)}
        </div>
      )}

      <form onSubmit={submit}>
        <div className="field">
          <label>Message de motivation *</label>
          <textarea required minLength={20} value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Pourquoi cette mission, ce que vous voulez apprendre…" />
        </div>
        <div className="field">
          <label>CV (optionnel)</label>
          <input type="file" accept=".pdf,.doc,.docx"
            onChange={e => setCv(e.target.files?.[0] || null)} />
          <span className="hint">PDF ou Word, moins de 5 Mo.</span>
        </div>
        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Envoi…' : 'Envoyer ma candidature'}
        </button>
      </form>
    </>
  )
}

function Toast({ message, kind = 'success' }) {
  return (
    <div className={`toast toast-${kind}`} role="status" aria-live="polite">
      {message}
    </div>
  )
}
