import { Outlet, Link, NavLink } from 'react-router-dom'

export default function Layout() {
  return (
    <>
      <header className="site-header">
        <div className="container inner">
          <Link to="/" className="brand">tsotra</Link>
          <nav className="nav" aria-label="Navigation principale">
            <NavLink to="/offers">Missions</NavLink>
            <NavLink to="/publish">Publier</NavLink>
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
