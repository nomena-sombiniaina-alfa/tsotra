import { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { auth } from '../api.js'
import ThemeToggle from './ThemeToggle.jsx'
import NavMenu from './NavMenu.jsx'
import MobileMenu from './MobileMenu.jsx'
import { STAGE_DOMAINS, VOLUNTEER_TYPES, PROFILS } from '../data/menus.js'

export default function Layout() {
  const navigate = useNavigate()
  const logged = auth.isLogged()
  const [mobileOpen, setMobileOpen] = useState(false)

  function logout() {
    auth.clear()
    navigate('/')
  }

  return (
    <>
      <header className="site-header">
        <div className="container inner">
          <Link to="/" className="brand" aria-label="Accueil tsotra">
            tsotra
          </Link>

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
                <Link to="/dashboard" className="btn btn-ghost btn-sm always-show desktop-only">
                  Mon espace
                </Link>
                <button className="btn btn-ghost btn-sm always-show desktop-only" onClick={logout}>
                  Déconnexion
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm always-show desktop-only">
                Connexion
              </Link>
            )}
            <ThemeToggle />
            <button
              className="icon-btn mobile-only"
              aria-label="Ouvrir le menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6"  x2="21" y2="6"  />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} onLogout={logout} />

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="cols">
            <div>
              <Link to="/" className="brand" style={{ fontSize: '1.2rem' }}>
                tsotra
              </Link>
              <p style={{ marginTop: '0.7em', maxWidth: '38ch' }}>
                Plateforme de stages non rémunérés et de volontariat structuré.
                Pensée pour faciliter une première expérience claire et encadrée.
              </p>
            </div>
            <div>
              <h4>Candidats</h4>
              <ul>
                <li><Link to="/offers">Trouver une mission</Link></li>
                <li><Link to="/offers?type=internship">Stages</Link></li>
                <li><Link to="/offers?type=volunteer">Volontariat</Link></li>
              </ul>
            </div>
            <div>
              <h4>Recruteurs</h4>
              <ul>
                <li><Link to="/publish">Publier une mission</Link></li>
                <li><Link to="/login">Connexion</Link></li>
                <li><Link to="/register">Créer un compte</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
