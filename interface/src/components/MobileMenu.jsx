import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { auth } from '../api.js'
import { STAGE_DOMAINS, VOLUNTEER_TYPES, PROFILS } from '../data/menus.js'

export default function MobileMenu({ open, onClose, onLogout }) {
  const logged = auth.isLogged()
  const [section, setSection] = useState(null) // 'stage' | 'volunteer' | 'profil' | null

  useEffect(() => {
    if (!open) setSection(null)
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  function close() { onClose() }

  return (
    <div className="mobile-menu-root" role="dialog" aria-modal="true" aria-label="Menu">
      <button className="mobile-scrim" aria-label="Fermer le menu" onClick={close} />
      <div className="mobile-sheet">
        <div className="mobile-sheet-header">
          <Link to="/" onClick={close} className="brand">
            tsotra
          </Link>
          <button className="icon-btn" aria-label="Fermer" onClick={close}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="mobile-nav" aria-label="Navigation mobile">
          <Section
            label="Stages par domaine"
            open={section === 'stage'}
            onToggle={() => setSection(s => s === 'stage' ? null : 'stage')}
          >
            <MobileGroup title="Populaires" items={STAGE_DOMAINS.popular} onItemClick={close} />
            <MobileGroup title="Métiers" items={STAGE_DOMAINS.metiers} onItemClick={close} />
            <MobileGroup title="Autres secteurs" items={STAGE_DOMAINS.publics} onItemClick={close} />
            <MobileFooter to="/offers?type=internship" onClick={close}>Tous les stages</MobileFooter>
          </Section>

          <Section
            label="Volontariat"
            open={section === 'volunteer'}
            onToggle={() => setSection(s => s === 'volunteer' ? null : 'volunteer')}
          >
            <MobileGroup title="Thématiques" items={VOLUNTEER_TYPES.thematiques} onItemClick={close} />
            <MobileGroup title="Formats" items={VOLUNTEER_TYPES.formats} onItemClick={close} />
            <MobileGroup title="Durée & mode" items={VOLUNTEER_TYPES.duree} onItemClick={close} />
            <MobileFooter to="/offers?type=volunteer" onClick={close}>Toutes les missions</MobileFooter>
          </Section>

          <Section
            label="Profils"
            open={section === 'profil'}
            onToggle={() => setSection(s => s === 'profil' ? null : 'profil')}
          >
            <MobileGroup items={PROFILS} onItemClick={close} />
          </Section>

          <div className="mobile-divider" />

          <Link to="/offers" onClick={close} className="mobile-link">Toutes les missions</Link>
          <Link to="/publish" onClick={close} className="mobile-link">Publier une mission</Link>

          <div className="mobile-divider" />

          {logged ? (
            <>
              <Link to="/dashboard" onClick={close} className="mobile-link">Mon espace</Link>
              <button className="mobile-link mobile-link-danger" onClick={() => { onLogout(); close() }}>
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/login" onClick={close} className="btn btn-primary btn-block" style={{ marginTop: '0.5em' }}>
              Connexion recruteur
            </Link>
          )}
        </nav>
      </div>
    </div>
  )
}

function Section({ label, open, onToggle, children }) {
  return (
    <div className={`mobile-section ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="mobile-section-trigger"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span>{label}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
             className="caret" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div className="mobile-section-body">{children}</div>}
    </div>
  )
}

function MobileGroup({ title, items, onItemClick }) {
  return (
    <div className="mobile-group">
      {title && <div className="mobile-group-title">{title}</div>}
      <ul>
        {items.map(it => (
          <li key={it.to + it.label}>
            <Link to={it.to} onClick={onItemClick} className="mobile-item">
              <span className="mobile-item-label">{it.label}</span>
              {it.hint && <span className="mobile-item-hint">{it.hint}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MobileFooter({ to, onClick, children }) {
  return (
    <Link to={to} onClick={onClick} className="mobile-footer-link">
      {children}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
      </svg>
    </Link>
  )
}
