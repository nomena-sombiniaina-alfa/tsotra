import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, auth, flatErrors } from '../api.js'

const PROVIDERS = [
  {
    id: 'mvola',
    label: 'MVola',
    operator: 'Telma',
    accent: '#ffb400',
    hint: '034 / 038',
  },
  {
    id: 'orange',
    label: 'Orange Money',
    operator: 'Orange',
    accent: '#ff7900',
    hint: '032',
  },
  {
    id: 'airtel',
    label: 'Airtel Money',
    operator: 'Airtel',
    accent: '#e40000',
    hint: '033',
  },
]

const PRICE_MGA = 10000 // doit refléter TSOTRA_OFFER_PRICE_MGA côté backend
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 120000
const DEBUG_SIMULATE = import.meta.env.DEV

export default function PaymentChoice() {
  const { id } = useParams()
  const navigate = useNavigate()
  const logged = auth.isLogged()

  const [offer, setOffer] = useState(null)
  const [provider, setProvider] = useState('mvola')
  const [msisdn, setMsisdn] = useState('')
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [payment, setPayment] = useState(null)
  const [instructions, setInstructions] = useState('')
  const [paymentUrl, setPaymentUrl] = useState('')
  const [phase, setPhase] = useState('form') // form | waiting | success | failed | timeout
  const pollRef = useRef(null)

  useEffect(() => {
    if (!logged) {
      navigate(`/login?next=/dashboard/offers/${id}/pay`)
      return
    }
    api.myOffer(id)
      .then(r => {
        setOffer(r.data)
        if (r.data.status === 'published') setPhase('success')
      })
      .catch(err => setErrors(flatErrors(err)))
  }, [id, logged, navigate])

  useEffect(() => () => clearInterval(pollRef.current), [])

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrors([])
    try {
      const cleaned = msisdn.replace(/[\s+]/g, '')
      const r = await api.payOffer(id, { provider, msisdn: cleaned })
      setPayment(r.data.payment)
      setInstructions(r.data.instructions || '')
      setPaymentUrl(r.data.payment_url || '')
      setPhase('waiting')
      if (r.data.payment_url) {
        window.location.href = r.data.payment_url
        return
      }
      startPolling()
    } catch (err) {
      setErrors(flatErrors(err))
    } finally {
      setSubmitting(false)
    }
  }

  function startPolling() {
    const startedAt = Date.now()
    clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.myOffer(id)
        setOffer(r.data)
        if (r.data.status === 'published') {
          clearInterval(pollRef.current)
          setPhase('success')
        } else if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          clearInterval(pollRef.current)
          setPhase('timeout')
        }
      } catch {
        /* on continue de poller */
      }
    }, POLL_INTERVAL_MS)
  }

  async function simulate(success) {
    if (!payment) return
    try {
      await api.simulatePayment(payment.id, success)
      const r = await api.myOffer(id)
      setOffer(r.data)
      clearInterval(pollRef.current)
      setPhase(success ? 'success' : 'failed')
    } catch (err) {
      setErrors(flatErrors(err))
    }
  }

  function retry() {
    setPayment(null)
    setPhase('form')
    setErrors([])
  }

  if (!logged) return null

  return (
    <section className="section dashboard-page">
      <div className="container" style={{ maxWidth: 720 }}>
        <Link to="/dashboard" className="link-back">← Retour à mon espace</Link>

        <h1 style={{
          fontSize: '2rem',
          fontFamily: 'var(--serif)',
          fontWeight: 600,
          marginBottom: '0.3em',
        }}>
          Publier votre mission
        </h1>
        <p className="lead" style={{ marginBottom: '1.5em' }}>
          Payez {formatMGA(PRICE_MGA)} via Mobile Money pour rendre votre annonce visible.
        </p>

        {offer && (
          <div className="card" style={{
            marginBottom: '1.5em',
            background: 'var(--color-surface, var(--bg-soft))',
          }}>
            <strong>{offer.title}</strong>
            <div style={{
              color: 'var(--color-foreground-muted, var(--text-muted))',
              fontSize: '0.9rem',
              marginTop: '0.3em',
            }}>
              {offer.type === 'internship' ? 'Stage' : 'Volontariat'}
              {' · '}{offer.domain}
              {offer.location ? ` · ${offer.location}` : ''}
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="alert alert-error" style={{ marginBottom: '1em' }}>
            {errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}

        {phase === 'form' && (
          <PaymentForm
            provider={provider}
            setProvider={setProvider}
            msisdn={msisdn}
            setMsisdn={setMsisdn}
            submitting={submitting}
            onSubmit={submit}
          />
        )}

        {phase === 'waiting' && (
          <WaitingPanel
            provider={provider}
            instructions={instructions}
            paymentUrl={paymentUrl}
            onCancel={retry}
            onSimulate={DEBUG_SIMULATE ? simulate : null}
          />
        )}

        {phase === 'success' && <SuccessPanel offerId={id} />}

        {phase === 'failed' && <FailedPanel onRetry={retry} />}

        {phase === 'timeout' && (
          <TimeoutPanel onRetry={retry} onKeepWaiting={startPolling} />
        )}
      </div>
    </section>
  )
}

function PaymentForm({ provider, setProvider, msisdn, setMsisdn,
                       submitting, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="card">
      <div className="field">
        <label style={{ marginBottom: '0.5em' }}>Moyen de paiement *</label>
        <div style={{ display: 'grid', gap: '0.6em' }}>
          {PROVIDERS.map(p => {
            const active = p.id === provider
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                aria-pressed={active}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.8em',
                  padding: '0.85em 1em',
                  border: `2px solid ${active ? p.accent : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius)',
                  background: active
                    ? `${p.accent}14`
                    : 'var(--color-surface, transparent)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'inherit',
                  transition: 'all 120ms ease',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.7em' }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: p.accent, color: '#fff',
                    fontWeight: 700, fontSize: '0.85rem',
                    display: 'inline-flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                  }}>
                    {p.label[0]}
                  </span>
                  <span>
                    <div style={{ fontWeight: 600 }}>{p.label}</div>
                    <div style={{
                      fontSize: '0.82rem',
                      color: 'var(--color-foreground-muted, var(--text-muted))',
                    }}>
                      {p.operator} · numéros {p.hint}
                    </div>
                  </span>
                </span>
                <span aria-hidden style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${active ? p.accent : 'var(--color-border-strong)'}`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && (
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: p.accent,
                    }} />
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="field">
        <label>Numéro Mobile Money *</label>
        <input
          required
          inputMode="tel"
          autoComplete="tel"
          value={msisdn}
          onChange={e => setMsisdn(e.target.value)}
          placeholder="ex : 0341234567"
        />
        <span className="hint">
          Vous recevrez une notification push ou un code USSD sur ce numéro.
        </span>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.8em 1em',
        background: 'var(--color-surface, var(--bg-soft))',
        borderRadius: 'var(--radius)',
        marginBottom: '1em',
      }}>
        <span style={{ color: 'var(--color-foreground-muted, var(--text-muted))' }}>
          Montant à payer
        </span>
        <strong style={{ fontSize: '1.2rem' }}>{formatMGA(PRICE_MGA)}</strong>
      </div>

      <button className="btn btn-primary btn-block" disabled={submitting}>
        {submitting ? 'Initialisation…' : `Payer ${formatMGA(PRICE_MGA)}`}
      </button>
    </form>
  )
}

function WaitingPanel({ provider, instructions, paymentUrl, onCancel, onSimulate }) {
  const p = PROVIDERS.find(x => x.id === provider)
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: `${p.accent}22`, color: p.accent,
        margin: '0 auto 1em',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem', fontWeight: 700,
      }}>
        <Spinner color={p.accent} />
      </div>
      <h2 style={{ marginBottom: '0.4em' }}>En attente de confirmation</h2>
      <p style={{
        color: 'var(--color-foreground-muted, var(--text-muted))',
        marginBottom: '1.4em',
      }}>
        {instructions || `Confirmez le paiement sur votre téléphone ${p.label}.`}
      </p>

      {paymentUrl && (
        <a href={paymentUrl} className="btn btn-primary"
           style={{ marginBottom: '0.8em' }}>
          Aller à la page de paiement
        </a>
      )}

      <div style={{
        display: 'flex', gap: '0.6em', justifyContent: 'center',
        marginTop: '1em', flexWrap: 'wrap',
      }}>
        <button type="button" className="btn" onClick={onCancel}>
          Annuler
        </button>
        {onSimulate && (
          <>
            <button type="button" className="btn"
                    style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                    onClick={() => onSimulate(true)}>
              [DEV] Simuler succès
            </button>
            <button type="button" className="btn"
                    style={{ borderColor: 'var(--color-destructive)', color: 'var(--color-destructive)' }}
                    onClick={() => onSimulate(false)}>
              [DEV] Simuler échec
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SuccessPanel({ offerId }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--color-success-bg)', color: 'var(--color-success)',
        margin: '0 auto 1em',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem',
      }}>✓</div>
      <h2 style={{ marginBottom: '0.4em' }}>Paiement confirmé</h2>
      <p style={{
        color: 'var(--color-foreground-muted, var(--text-muted))',
        marginBottom: '1.4em',
      }}>
        Votre mission est maintenant publiée et visible par les candidats.
      </p>
      <div style={{ display: 'flex', gap: '0.6em', justifyContent: 'center' }}>
        <Link to={`/offers/${offerId}`} className="btn btn-primary">
          Voir mon annonce
        </Link>
        <Link to="/dashboard" className="btn">Mon espace</Link>
      </div>
    </div>
  )
}

function FailedPanel({ onRetry }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--color-destructive-bg)', color: 'var(--color-destructive)',
        margin: '0 auto 1em',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem',
      }}>✕</div>
      <h2 style={{ marginBottom: '0.4em' }}>Paiement échoué</h2>
      <p style={{
        color: 'var(--color-foreground-muted, var(--text-muted))',
        marginBottom: '1.4em',
      }}>
        Vous pouvez réessayer avec un autre moyen ou un autre numéro.
      </p>
      <button className="btn btn-primary" onClick={onRetry}>
        Réessayer
      </button>
    </div>
  )
}

function TimeoutPanel({ onRetry, onKeepWaiting }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <h2 style={{ marginBottom: '0.4em' }}>Ça prend un peu de temps…</h2>
      <p style={{
        color: 'var(--color-foreground-muted, var(--text-muted))',
        marginBottom: '1.4em',
      }}>
        Si vous avez déjà confirmé sur votre téléphone, attendez encore un peu.
        Sinon, vous pouvez recommencer.
      </p>
      <div style={{ display: 'flex', gap: '0.6em', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={onKeepWaiting}>
          Attendre encore
        </button>
        <button className="btn" onClick={onRetry}>Recommencer</button>
      </div>
    </div>
  )
}

function Spinner({ color }) {
  return (
    <span
      aria-hidden
      style={{
        width: 28, height: 28, borderRadius: '50%',
        border: `3px solid ${color}33`, borderTopColor: color,
        animation: 'tsotra-spin 0.8s linear infinite',
        display: 'inline-block',
      }}
    />
  )
}

function formatMGA(n) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' MGA'
}
