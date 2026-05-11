import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, auth, flatErrors } from '../api.js'

export default function Register() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/dashboard'

  const [form, setForm] = useState({
    email: '', password: '', organization_name: '',
  })
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrors([])
    try {
      const r = await api.register(form)
      auth.set({ access: r.data.access, refresh: r.data.refresh, user: r.data.user })
      navigate(next)
    } catch (err) {
      setErrors(flatErrors(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container">
      <div className="auth-card">
        <h1>Créer un compte recruteur</h1>
        <p className="sub">Le compte est nécessaire pour publier et gérer vos missions.</p>

        {errors.length > 0 && (
          <div className="alert alert-error">{errors.map((e, i) => <div key={i}>{e}</div>)}</div>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label>Email *</label>
            <input type="email" required autoComplete="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="field">
            <label>Nom de l'organisation</label>
            <input type="text" autoComplete="organization" value={form.organization_name}
              onChange={e => setForm(f => ({ ...f, organization_name: e.target.value }))} />
            <span className="hint">Optionnel — modifiable plus tard.</span>
          </div>
          <div className="field">
            <label>Mot de passe *</label>
            <input type="password" required minLength={8} autoComplete="new-password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <span className="hint">8 caractères minimum.</span>
          </div>
          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <div className="switch">
          Déjà inscrit·e ? <Link to="/login">Connexion</Link>
        </div>
      </div>
    </div>
  )
}
