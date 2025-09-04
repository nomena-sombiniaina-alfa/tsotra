import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <section className="hero">
      <div className="container">
        <h1>Premières expériences, missions concrètes.</h1>
        <p className="lead">
          tsotra centralise des stages non rémunérés et des missions de volontariat
          encadrées, accessibles dès la première expérience.
        </p>
        <div className="ctas">
          <Link to="/offers" className="btn btn-primary">Trouver une mission</Link>
          <Link to="/publish" className="btn btn-ghost">Publier une mission</Link>
        </div>
      </div>
    </section>
  )
}
