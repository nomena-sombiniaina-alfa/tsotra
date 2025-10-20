import { Outlet, Link, useNavigate } from 'react-router-dom'
import { auth } from '../api.js'
import ThemeToggle from './ThemeToggle.jsx'
import NavMenu from './NavMenu.jsx'
import { STAGE_DOMAINS, VOLUNTEER_TYPES, PROFILS } from '../data/menus.js'

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
          <Link to="/" className="brand" aria-label="Accueil tsotra">tsotra</Link>
          <nav className="nav nav-desktop" aria-label="Navigation principale">
            <NavMenu
              label="Stages"
              groups={[
                { title: 'Populaires', items: STAGE_DOMAINS.popular },
                { title: 'Métiers',    items: STAGE_DOMAINS.metiers },
                { title: 'Autres secteurs', items: STAGE_DOMAINS.publics },
              ]}
              wide
              footer={{ label: 'Voir tous les stages', to: '/offers?type=internship' }}
            />
            <NavMenu
              label="Volontariat"
              groups={[
                { title: 'Thématiques', items: VOLUNTEER_TYPES.thematiques },
                { title: 'Formats',     items: VOLUNTEER_TYPES.formats },
                { title: 'Durée & mode', items: VOLUNTEER_TYPES.duree },
              ]}
              wide
              footer={{ label: 'Voir toutes les missions de volontariat', to: '/offers?type=volunteer' }}
            />
            <NavMenu
              label="Profils"
              items={PROFILS}
              footer={{ label: 'Voir toutes les missions', to: '/offers' }}
            />
            <Link to="/publish" className="nav-link">Publier</Link>
          </nav>
          <div className="header-actions">
            {logged ? (
              <>
                <Link to="/dashboard" className="btn btn-ghost btn-sm">Mon espace</Link>
                <button className="btn btn-ghost btn-sm" onClick={logout}>Déconnexion</button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">Connexion</Link>
            )}
            <ThemeToggle />
          </div>
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
