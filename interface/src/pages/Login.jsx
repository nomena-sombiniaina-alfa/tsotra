import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, auth, flatErrors } from '../api.js'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrors([])
    try {
      const r = await api.login(form)
      auth.set({ access: r.data.access, refresh: r.data.refresh })
      const me = await api.me()
      auth.set({ user: me.data })
      navigate('/dashboard')
    } catch (err) {
      setErrors(flatErrors(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container">
      <div className="auth-card">
        <h1>Connexion recruteur</h1>
        <p className="sub">
          L'espace candidat ne nécessite pas de compte — il suffit de postuler depuis l'offre.
        </p>

        {errors.length > 0 && (
          <div className="alert alert-error">{errors.map((e, i) => <div key={i}>{e}</div>)}</div>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input type="email" required autoComplete="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input type="password" required autoComplete="current-password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="switch">
          Pas encore de compte ? <Link to="/publish">Publiez votre première mission</Link>
          {' '}— le compte se crée pendant la publication.
        </div>
      </div>
    </div>
  )
}
