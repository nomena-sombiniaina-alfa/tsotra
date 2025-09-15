import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { auth } from '../api.js'
import ThemeToggle from './ThemeToggle.jsx'

export default function Layout() {
  const navigate = useNavigate()
  const logged = auth.isLogged()

  function logout() {
    auth.clear()
    navigate('/')
  }

  return (
    <>
      <header className="site-header">
        <div className="container inner">
          <Link to="/" className="brand">tsotra</Link>
          <nav className="nav" aria-label="Navigation principale">
            <NavLink to="/offers">Missions</NavLink>
            <NavLink to="/publish">Publier</NavLink>
            {logged ? (
              <>
                <NavLink to="/dashboard">Mon espace</NavLink>
                <button className="btn btn-ghost btn-sm" onClick={logout}>Déconnexion</button>
              </>
            ) : (
              <NavLink to="/login">Connexion</NavLink>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="legal">
            © {new Date().getFullYear()} tsotra · stages non rémunérés et volontariat
          </div>
        </div>
      </footer>
    </>
  )
}
