import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, auth, flatErrors } from '../api.js'

const DRAFT_KEY = 'tsotra.offer-draft'

export default function PublishOffer() {
  const navigate = useNavigate()
  const logged = auth.isLogged()

  const [draft, setDraft] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}') }
    catch { return {} }
  })
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const [full, setFull] = useState({
    description_full: '',
    tasks: '',
    requirements: '',
    experience_required: 0,
    experience_justification: '',
    duration: '',
    mode: 'onsite',
    contact_method: '',
    status: 'published',
  })

  const step = logged && draft.title ? 'detail' : 'init'

  async function submitInit(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrors([])
    try {
      await api.draftOffer(draft)
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      navigate('/register?next=/publish')
    } catch (err) {
      setErrors(flatErrors(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitDetail(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrors([])
    try {
      const payload = { ...draft, ...full }
      payload.experience_required = Number(payload.experience_required) || 0
      const r = await api.createOffer(payload)
      localStorage.removeItem(DRAFT_KEY)
      navigate(`/offers/${r.data.id}`)
    } catch (err) {
      setErrors(flatErrors(err))
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Étape 1 : sans compte ───
  if (step === 'init') {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <Steps active={0} />
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--serif)', fontWeight: 600, marginBottom: '0.3em' }}>
            Publier une mission
          </h1>
          <p className="lead" style={{ marginBottom: '1.5em' }}>
            Commencez par décrire votre mission. Nous créerons votre compte juste après.
          </p>

          {errors.length > 0 && (
            <div className="alert alert-error">{errors.map((e, i) => <div key={i}>{e}</div>)}</div>
          )}

          <form onSubmit={submitInit} className="card">
            <div className="field">
              <label>Titre de la mission *</label>
              <input required value={draft.title || ''}
                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                placeholder="ex : Stage assistant·e communication digitale" />
            </div>
            <div className="row">
              <div className="field">
                <label>Type *</label>
                <select required value={draft.type || ''}
                  onChange={e => setDraft(d => ({ ...d, type: e.target.value }))}>
                  <option value="">— Choisir —</option>
                  <option value="internship">Stage</option>
                  <option value="volunteer">Volontariat</option>
                </select>
              </div>
              <div className="field">
                <label>Domaine *</label>
                <input required value={draft.domain || ''}
                  onChange={e => setDraft(d => ({ ...d, domain: e.target.value }))}
                  placeholder="ex : Communication" />
              </div>
            </div>
            <div className="field">
              <label>Description courte *</label>
              <textarea required maxLength={300} value={draft.description_short || ''}
                onChange={e => setDraft(d => ({ ...d, description_short: e.target.value }))}
                placeholder="2-3 phrases pour présenter la mission" />
              <span className="hint">300 caractères max — visible dans la liste.</span>
            </div>
            <div className="field">
              <label>Localisation</label>
              <input value={draft.location || ''}
                onChange={e => setDraft(d => ({ ...d, location: e.target.value }))}
                placeholder="ex : Paris (laissez vide si entièrement à distance)" />
            </div>
            <button className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? '…' : 'Continuer → Créer mon compte'}
            </button>
          </form>

          <div className="switch" style={{ marginTop: '1.2em', textAlign: 'center', color: 'var(--text-muted)' }}>
            Déjà recruteur ? <Link to="/login">Connectez-vous</Link>.
          </div>
        </div>
      </section>
    )
  }

  // ─── Étape 3 : connecté + draft ───
  if (!draft.title) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 600 }}>
          <h1>Aucun brouillon en cours</h1>
          <p>Créez votre première mission depuis votre espace.</p>
          <Link to="/dashboard" className="btn btn-primary">Aller à mon espace</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <Steps active={2} />
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--serif)', fontWeight: 600, marginBottom: '0.3em' }}>
          Compléter la mission
        </h1>
        <p className="lead" style={{ marginBottom: '1.5em' }}>
          Plus la description est précise, plus les candidatures seront pertinentes.
        </p>

        <div className="card" style={{ marginBottom: '1.5em', background: 'var(--bg-soft)' }}>
          <strong>{draft.title}</strong>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3em' }}>
            {draft.type === 'internship' ? 'Stage' : 'Volontariat'} · {draft.domain}
            {draft.location ? ` · ${draft.location}` : ''}
          </div>
        </div>

        {errors.length > 0 && (
          <div className="alert alert-error">{errors.map((e, i) => <div key={i}>{e}</div>)}</div>
        )}

        <form onSubmit={submitDetail} className="card">
          <div className="field">
            <label>Description détaillée *</label>
            <textarea required value={full.description_full}
              onChange={e => setFull(f => ({ ...f, description_full: e.target.value }))} />
          </div>
          <div className="field">
            <label>Tâches concrètes *</label>
            <textarea required value={full.tasks}
              onChange={e => setFull(f => ({ ...f, tasks: e.target.value }))}
              placeholder="Ce que la personne fera concrètement, jour après jour" />
          </div>
          <div className="field">
            <label>Profil recherché *</label>
            <textarea required value={full.requirements}
              onChange={e => setFull(f => ({ ...f, requirements: e.target.value }))} />
          </div>

          <div className="row">
            <div className="field">
              <label>Expérience attendue (années)</label>
              <input type="number" min="0" max="10" value={full.experience_required}
                onChange={e => setFull(f => ({ ...f, experience_required: e.target.value }))} />
              <span className="hint">Laissez à 0 pour rester ouvert aux profils débutants.</span>
            </div>
            <div className="field">
              <label>Mode *</label>
              <select required value={full.mode}
                onChange={e => setFull(f => ({ ...f, mode: e.target.value }))}>
                <option value="onsite">Sur site</option>
                <option value="remote">À distance</option>
                <option value="hybrid">Hybride</option>
              </select>
            </div>
          </div>

          {Number(full.experience_required) > 0 && (
            <div className="field">
              <label>Justification de l'expérience demandée *</label>
              <textarea required value={full.experience_justification}
                onChange={e => setFull(f => ({ ...f, experience_justification: e.target.value }))}
                placeholder="Pourquoi cette mission ne convient pas à un·e débutant·e ?" />
              <span className="hint">Obligatoire et visible par les candidats.</span>
            </div>
          )}

          <div className="row">
            <div className="field">
              <label>Durée *</label>
              <input required value={full.duration}
                onChange={e => setFull(f => ({ ...f, duration: e.target.value }))}
                placeholder="ex : 3 mois, 6 mois, ponctuel" />
            </div>
            <div className="field">
              <label>Statut *</label>
              <select value={full.status} onChange={e => setFull(f => ({ ...f, status: e.target.value }))}>
                <option value="published">Publier maintenant</option>
                <option value="draft">Garder en brouillon</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Méthode de candidature *</label>
            <input required value={full.contact_method}
              onChange={e => setFull(f => ({ ...f, contact_method: e.target.value }))}
              placeholder="ex : contact@asso.org ou un lien vers votre formulaire" />
            <span className="hint">Les candidatures envoyées via tsotra arrivent aussi sur votre email d'inscription.</span>
          </div>

          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Publication…' : 'Publier la mission'}
          </button>
        </form>
      </div>
    </section>
  )
}

function Steps({ active }) {
  return (
    <div className="steps">
      <span className={`dot ${active >= 0 ? 'active' : ''}`} />
      <span>Mission</span>
      <span className={`dot ${active >= 1 ? 'active' : ''}`} />
      <span>Compte</span>
      <span className={`dot ${active >= 2 ? 'active' : ''}`} />
      <span>Détails &amp; publication</span>
    </div>
  )
}
