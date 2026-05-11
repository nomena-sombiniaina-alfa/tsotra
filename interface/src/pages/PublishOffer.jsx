import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, auth, flatErrors } from '../api.js'

const DRAFT_KEY = 'tsotra.offer-draft'
const OFFER_ID_KEY = 'tsotra.current-draft-id'

const DOMAINS = [
  'Communication',
  'Marketing / Digital',
  'Développement / Tech',
  'Design / Graphisme',
  'Administration / Gestion',
  'Comptabilité / Finance',
  'Ressources humaines',
  'Éducation / Formation',
  'Santé / Social',
  'Environnement / Agriculture',
  'Tourisme / Hôtellerie',
  'Logistique',
  'Journalisme / Médias',
]
const DOMAIN_OTHER = '__other__'

// Durées proposées selon le type de mission.
// Stage : conformément à la pratique malgache habituelle (2 à 6 mois).
// Volontariat : du ponctuel à 6 mois, tout est envisageable.
const STAGE_DURATIONS = ['2 mois', '3 mois', '4 mois', '6 mois']
const VOLUNTEER_DURATIONS = [
  'Ponctuel (quelques heures)',
  'Quelques jours',
  '1 semaine',
  '2 semaines',
  '1 mois',
  '2 mois',
  '3 mois',
  '4 mois',
  '5 mois',
  '6 mois',
]
const DURATION_OTHER = '__other__'

function durationsFor(type) {
  return type === 'volunteer' ? VOLUNTEER_DURATIONS : STAGE_DURATIONS
}

const FORM_FIELDS = [
  'title', 'type', 'domain', 'location', 'mode', 'duration',
  'description_full', 'tasks', 'requirements',
]
const EMPTY_FORM = FORM_FIELDS.reduce((acc, k) => ({ ...acc, [k]: '' }), {})
EMPTY_FORM.mode = 'onsite'
EMPTY_FORM.type = 'internship'
EMPTY_FORM.duration = '3 mois'

const SAVE_DEBOUNCE_MS = 600

function pickFromOffer(o) {
  const out = {}
  FORM_FIELDS.forEach(k => { out[k] = o[k] ?? '' })
  if (!out.mode) out.mode = 'onsite'
  return out
}

export default function PublishOffer() {
  const navigate = useNavigate()
  const logged = auth.isLogged()

  const [form, setForm] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')
      return { ...EMPTY_FORM, ...saved }
    } catch { return EMPTY_FORM }
  })
  const [offerId, setOfferId] = useState(() => {
    const v = localStorage.getItem(OFFER_ID_KEY)
    return v ? Number(v) : null
  })
  const [domainChoice, setDomainChoice] = useState(() =>
    DOMAINS.includes(form.domain) ? form.domain
      : form.domain ? DOMAIN_OTHER : ''
  )
  const [durationChoice, setDurationChoice] = useState(() => {
    const list = durationsFor(form.type)
    return list.includes(form.duration) ? form.duration
      : form.duration ? DURATION_OTHER : ''
  })
  const [wantsRequirements, setWantsRequirements] = useState(
    () => Boolean(form.requirements)
  )
  const [loaded, setLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle') // idle|saving|saved|error
  const [errors, setErrors] = useState([])

  const offerIdRef = useRef(offerId)
  const saveTimerRef = useRef(null)
  const savingRef = useRef(false)
  const pendingRef = useRef(null)

  useEffect(() => { offerIdRef.current = offerId }, [offerId])

  // ─── Chargement initial ──────────────────────────────────────────────
  // Si un offerId est mémorisé pour le recruteur connecté, on récupère
  // l'offre côté serveur pour repartir de l'état canonique.
  useEffect(() => {
    let cancelled = false
    if (logged && offerId) {
      api.myOffer(offerId)
        .then(r => {
          if (cancelled) return
          const fields = pickFromOffer(r.data)
          setForm(f => ({ ...f, ...fields }))
          setDomainChoice(
            DOMAINS.includes(fields.domain) ? fields.domain
              : fields.domain ? DOMAIN_OTHER : ''
          )
          {
            const list = durationsFor(fields.type)
            setDurationChoice(
              list.includes(fields.duration) ? fields.duration
                : fields.duration ? DURATION_OTHER : ''
            )
          }
          setWantsRequirements(Boolean(fields.requirements))
          setLoaded(true)
        })
        .catch(err => {
          if (cancelled) return
          if (err?.response?.status === 404) {
            // Offre supprimée entre-temps → on repart de zéro.
            localStorage.removeItem(OFFER_ID_KEY)
            offerIdRef.current = null
            setOfferId(null)
          }
          setLoaded(true)
        })
    } else {
      setLoaded(true)
    }
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Auto-save côté serveur ──────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return
    if (!logged) {
      // Anonyme : on garde un tampon local en attendant l'inscription.
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
      return
    }
    if (!offerIdRef.current) {
      // Aussi un tampon tant que l'offre n'a pas encore été créée côté serveur.
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
    }
    if (!form.title || !form.type || !form.domain) {
      // Pas encore assez de données pour créer/maj l'offre.
      return
    }
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => doSave(form), SAVE_DEBOUNCE_MS)
    return () => clearTimeout(saveTimerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, logged, loaded])

  async function doSave(snapshot) {
    if (savingRef.current) {
      pendingRef.current = snapshot
      return
    }
    savingRef.current = true
    setSaveStatus('saving')
    setErrors([])
    try {
      const payload = { ...snapshot, status: 'draft' }
      const currentId = offerIdRef.current
      if (currentId) {
        try {
          await api.updateOffer(currentId, payload)
        } catch (err) {
          if (err?.response?.status === 404) {
            offerIdRef.current = null
            setOfferId(null)
            localStorage.removeItem(OFFER_ID_KEY)
            const r = await api.createOffer(payload)
            offerIdRef.current = r.data.id
            setOfferId(r.data.id)
            localStorage.setItem(OFFER_ID_KEY, String(r.data.id))
            localStorage.removeItem(DRAFT_KEY)
          } else {
            throw err
          }
        }
      } else {
        const r = await api.createOffer(payload)
        offerIdRef.current = r.data.id
        setOfferId(r.data.id)
        localStorage.setItem(OFFER_ID_KEY, String(r.data.id))
        localStorage.removeItem(DRAFT_KEY)
      }
      setSaveStatus('saved')
    } catch (err) {
      setSaveStatus('error')
      setErrors(flatErrors(err))
    } finally {
      savingRef.current = false
      if (pendingRef.current) {
        const next = pendingRef.current
        pendingRef.current = null
        doSave(next)
      }
    }
  }

  // ─── Handlers ────────────────────────────────────────────────────────
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function onDomainSelect(value) {
    setDomainChoice(value)
    if (value === DOMAIN_OTHER) {
      if (DOMAINS.includes(form.domain)) update('domain', '')
    } else {
      update('domain', value)
    }
  }

  function onDurationSelect(value) {
    setDurationChoice(value)
    const list = durationsFor(form.type)
    if (value === DURATION_OTHER) {
      if (list.includes(form.duration)) update('duration', '')
    } else {
      update('duration', value)
    }
  }

  function onTypeChange(value) {
    // Si la durée actuelle n'appartient plus à la liste du nouveau type,
    // on la réinitialise pour éviter une valeur incohérente.
    const list = durationsFor(value)
    setForm(f => {
      const keep = list.includes(f.duration)
      return { ...f, type: value, duration: keep ? f.duration : '' }
    })
    setDurationChoice(prev => list.includes(form.duration) ? prev : '')
  }

  function onToggleRequirements(checked) {
    setWantsRequirements(checked)
    if (!checked) update('requirements', '')
  }

  function onModeChange(value) {
    // Quand on bascule en distanciel, on n'a plus besoin de l'adresse.
    setForm(f => ({
      ...f,
      mode: value,
      location: value === 'remote' ? '' : f.location,
    }))
  }

  function onContinue(e) {
    e.preventDefault()
    if (!logged) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
      navigate('/register?next=/publish')
      return
    }
    if (offerId) {
      navigate(`/dashboard/offers/${offerId}/pay`)
    }
  }

  const continueDisabled = logged && !offerId

  return (
    <section className="section dashboard-page publish-page">
      <div className="container">
        <div className="publish-header">
          <h1 className="publish-title">Publier une mission</h1>
          {logged && <SaveBadge status={saveStatus} />}
        </div>

        {!logged && (
          <div className="alert" style={{
            marginBottom: '1em',
            background: 'var(--color-info-bg, var(--bg-soft))',
            color: 'var(--color-info, inherit)',
          }}>
            Déjà recruteur ?{' '}
            <Link to="/login?next=/publish">Connectez-vous</Link>{' '}
            pour publier directement.
          </div>
        )}

        {errors.length > 0 && (
          <div className="alert alert-error" style={{ marginBottom: '1em' }}>
            {errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}

        <form onSubmit={onContinue}>
          <div className="form-grid">
            <div className="field field-full">
              <label>Titre de la mission *</label>
              <input required value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="ex : Stage assistant·e communication digitale" />
            </div>

            <div className="field">
              <label>Type *</label>
              <select required value={form.type}
                onChange={e => onTypeChange(e.target.value)}>
                <option value="internship">Stage</option>
                <option value="volunteer">Volontariat</option>
              </select>
            </div>

            <div className="field">
              <label>Domaine *</label>
              <select required value={domainChoice}
                onChange={e => onDomainSelect(e.target.value)}>
                <option value="">— Choisir —</option>
                {DOMAINS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value={DOMAIN_OTHER}>Autre (à préciser)</option>
              </select>
              {domainChoice === DOMAIN_OTHER && (
                <input required value={form.domain}
                  onChange={e => update('domain', e.target.value)}
                  placeholder="Précisez le domaine"
                  style={{ marginTop: '0.4em' }} />
              )}
            </div>

            <div className="field">
              <label>Mode *</label>
              <select required value={form.mode}
                onChange={e => onModeChange(e.target.value)}>
                <option value="onsite">Sur site</option>
                <option value="remote">À distance</option>
                <option value="hybrid">Hybride</option>
              </select>
            </div>

            <div className="field">
              <label>Durée *</label>
              <select required value={durationChoice}
                onChange={e => onDurationSelect(e.target.value)}>
                <option value="">— Choisir —</option>
                {durationsFor(form.type).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value={DURATION_OTHER}>Autre (à préciser)</option>
              </select>
              {durationChoice === DURATION_OTHER && (
                <input required value={form.duration}
                  onChange={e => update('duration', e.target.value)}
                  placeholder="Précisez la durée"
                  style={{ marginTop: '0.4em' }} />
              )}
            </div>

            {(form.mode === 'onsite' || form.mode === 'hybrid') && (
              <div className="field field-full">
                <label>Adresse de la mission *</label>
                <input required value={form.location}
                  onChange={e => update('location', e.target.value)}
                  placeholder="ex : Lot II A 23, Antananarivo 101" />
              </div>
            )}

            <div className="field">
              <label>Description détaillée *</label>
              <textarea required value={form.description_full}
                onChange={e => update('description_full', e.target.value)}
                placeholder="Contexte, mission, équipe…" />
            </div>

            <div className="field">
              <label>Tâches concrètes *</label>
              <textarea required value={form.tasks}
                onChange={e => update('tasks', e.target.value)}
                placeholder="Ce que la personne fera concrètement" />
            </div>

            <div className="field field-full">
              <label className="checkbox-row">
                <input type="checkbox"
                  checked={wantsRequirements}
                  onChange={e => onToggleRequirements(e.target.checked)} />
                <span>Préciser un profil recherché (optionnel)</span>
              </label>
              {wantsRequirements && (
                <textarea value={form.requirements}
                  onChange={e => update('requirements', e.target.value)}
                  placeholder="Compétences, savoir-être, formation…"
                  style={{ marginTop: '0.4em' }} />
              )}
            </div>
          </div>

          <button className="btn btn-primary btn-block"
                  disabled={continueDisabled}
                  style={{ marginTop: '0.4em' }}>
            Continuer
          </button>
        </form>
      </div>
    </section>
  )
}

function SaveBadge({ status }) {
  if (status === 'idle') return null
  const map = {
    saving:  { label: 'Enregistrement…', color: 'var(--color-foreground-muted)' },
    saved:   { label: 'Brouillon enregistré ✓', color: 'var(--color-success)' },
    error:   { label: 'Échec d\'enregistrement', color: 'var(--color-destructive)' },
  }
  const { label, color } = map[status]
  return (
    <span style={{
      fontSize: '0.85rem',
      color,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}
