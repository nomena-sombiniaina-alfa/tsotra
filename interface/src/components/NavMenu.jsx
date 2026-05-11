import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * NavMenu — Dropdown / mega-menu accessible.
 *
 * Props:
 * - label: string affiché sur le bouton
 * - groups: [{ title?, items: [{label, hint?, to}] }]  (mega-menu multi-colonnes)
 *   OU
 * - items: [{label, hint?, to}]  (dropdown simple)
 * - footer?: { label, to }   (lien "Voir tout" en bas du panel)
 * - align: 'left' | 'right'   (default 'left')
 * - wide: boolean             (true = mega panel large)
 */
export default function NavMenu({ label, items, groups, footer, align = 'left', wide = false }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const btnRef = useRef(null)
  const panelRef = useRef(null)

  // Fermer au clic en dehors
  useEffect(() => {
    if (!open) return
    function onDoc(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  // Fermer sur Escape
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function handleItemClick() {
    setOpen(false)
  }

  const cols = groups || (items ? [{ items }] : [])

  return (
    <div className="nav-menu" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className={`nav-trigger ${open ? 'is-open' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        {label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
             className="caret">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          className={`nav-panel ${wide ? 'is-wide' : ''} align-${align}`}
          role="menu"
        >
          <div className={`nav-panel-cols cols-${cols.length}`}>
            {cols.map((g, i) => (
              <div key={i} className="nav-col">
                {g.title && <div className="nav-col-title">{g.title}</div>}
                <ul className="nav-col-list">
                  {g.items.map(it => (
                    <li key={it.to + it.label}>
                      <Link
                        role="menuitem"
                        to={it.to}
                        onClick={handleItemClick}
                        className="nav-col-item"
                      >
                        <div className="nav-col-item-label">{it.label}</div>
                        {it.hint && <div className="nav-col-item-hint">{it.hint}</div>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {footer && (
            <div className="nav-panel-footer">
              <Link to={footer.to} onClick={handleItemClick} className="nav-footer-link">
                {footer.label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
