import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'

export default function Home() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    api.listOffers({ ordering: '-created_at' })
      .then(r => setFeatured((r.data.results ?? []).slice(0, 3)))
      .catch(() => {})
  }, [])

  function submitSearch(e) {
    e.preventDefault()
    const q = search.trim()
    navigate(q ? `/offers?search=${encodeURIComponent(q)}` : '/offers')
  }

  return (
    <>
      {/* ─── Hero (search-focused) ─── */}
      <section className="hero">
        <div className="container">
          <p className="tagline">Stages non rémunérés · Volontariat structuré</p>
          <h1>
            La première expérience,<br /><em>sans détour.</em>
          </h1>
          <p className="lede" style={{ maxWidth: '54ch', margin: '1em auto 2em' }}>
            Trouvez une mission encadrée, accessible dès la première expérience.
            Toutes les annonces sont transparentes et non rémunérées.
          </p>

          <div className="hero-search-wrap">
            <form className="search-cta" onSubmit={submitSearch} role="search">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                placeholder="Quelle mission cherchez-vous ?"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Rechercher une mission"
              />
              <button type="submit" className="btn btn-primary">Chercher</button>
            </form>
            <div className="suggested-tags">
              <span>Populaire :</span>
              <Link to="/offers?search=communication">Communication</Link>
              <Link to="/offers?search=développement">Développement</Link>
              <Link to="/offers?search=animation">Animation</Link>
              <Link to="/offers?type=volunteer">Volontariat</Link>
            </div>
          </div>

          <div className="trust-strip">
            <div className="stat">
              <strong>0</strong>
              <span>Expérience exigée par défaut</span>
            </div>
            <div className="stat">
              <strong>&lt;3 min</strong>
              <span>Pour publier une mission</span>
            </div>
            <div className="stat">
              <strong>100%</strong>
              <span>Annonces encadrées et transparentes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Catégories par domaine ─── */}
      <section className="section">
        <div className="container">
          <div className="kicker">Explorer par domaine</div>
          <h2>Trouvez votre terrain.</h2>
          <p className="lead">
            Des missions dans tous les domaines, choisies pour faire grandir un profil débutant.
          </p>

          <div className="grid-4">
            <Category
              icon={<IconCommunication />}
              label="Communication"
              count="Posts, réseaux, écriture"
              to="/offers?search=communication"
            />
            <Category
              icon={<IconCode />}
              label="Tech & web"
              count="Dev, data, support"
              to="/offers?search=développement"
            />
            <Category
              icon={<IconHands />}
              label="Social & associatif"
              count="Animation, terrain"
              to="/offers?search=social"
            />
            <Category
              icon={<IconArt />}
              label="Création & culture"
              count="Design, événementiel"
              to="/offers?search=création"
            />
          </div>
        </div>
      </section>

      {/* ─── Missions à la une ─── */}
      {featured.length > 0 && (
        <section className="section alt">
          <div className="container">
            <div className="kicker">Missions à la une</div>
            <h2>Des opportunités fraîchement publiées.</h2>
            <p className="lead">
              Toutes les missions sont vérifiées. Postulez en moins d'une minute, sans compte.
            </p>

            <div className="offers-grid">
              {featured.map(o => (
                <Link key={o.id} to={`/offers/${o.id}`} className="card offer-card">
                  <div className="meta">
                    <span className={`badge badge-${o.type === 'internship' ? 'internship' : 'volunteer'}`}>
                      {o.type_display}
                    </span>
                    <span className="badge badge-mode">{o.mode_display}</span>
                    {o.experience_required === 0 && (
                      <span className="badge badge-debutant">Débutant·e bienvenu·e</span>
                    )}
                  </div>
                  <h3>{o.title}</h3>
                  <div className="org">
                    {o.organization_name || 'Organisation'} · {o.location || 'Lieu non précisé'}
                  </div>
                  <p className="summary">{o.description_short}</p>
                  <span className="arrow">
                    Voir la mission
                    <ArrowRight />
                  </span>
                </Link>
              ))}
            </div>

            <div style={{ marginTop: '2em', textAlign: 'center' }}>
              <Link to="/offers" className="btn btn-ghost">Voir toutes les missions <ArrowRight /></Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Trust / Engagements ─── */}
      <section className="section">
        <div className="container">
          <div className="kicker">Nos engagements</div>
          <h2>Quatre règles, sans exception.</h2>
          <div className="grid-2">
            <div className="principle">
              <h3>Uniquement non rémunéré et encadré</h3>
              <p>Stages et volontariat avec mission claire. Pas de bénévolat déguisé en travail.</p>
            </div>
            <div className="principle">
              <h3>Transparence obligatoire</h3>
              <p>Description complète, tâches précises, durée et mode de travail explicités à la publication.</p>
            </div>
            <div className="principle">
              <h3>Priorité aux débutants</h3>
              <p>Aucune expérience exigée par défaut. Toute exigence d'expérience doit être justifiée par écrit.</p>
            </div>
            <div className="principle">
              <h3>Mise en relation directe</h3>
              <p>Pas d'intermédiaire, pas de frais cachés. Le recruteur reçoit la candidature dès qu'elle est envoyée.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA recruteur ─── */}
      <section className="section alt">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="kicker">Côté organisations</div>
          <h2 style={{ margin: '0 auto 0.5em' }}>Vous avez une mission à proposer ?</h2>
          <p className="lead" style={{ margin: '0 auto 2em' }}>
            Publiez en moins de 3 minutes. Recevez des candidatures motivées par email,
            sans abonnement et sans intermédiaire.
          </p>
          <Link to="/publish" className="btn btn-accent btn-lg">
            Publier une mission <ArrowRight />
          </Link>
        </div>
      </section>
    </>
  )
}

function Category({ icon, label, count, to }) {
  return (
    <Link to={to} className="category">
      <span className="cat-icon">{icon}</span>
      <h3>{label}</h3>
      <small>{count}</small>
    </Link>
  )
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  )
}

function IconCommunication() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function IconCode() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}
function IconHands() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function IconArt() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  )
}
