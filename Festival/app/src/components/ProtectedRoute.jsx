import { Navigate } from 'react-router-dom'
import { MESSAGES } from '../lib/registration'
import { useSession } from '../lib/useSession'

export default function ProtectedRoute({ children }) {
  const { session, loading, error } = useSession()

  if (loading) {
    return (
      <main className="page">
        <p className="muted" role="status">
          Cargando…
        </p>
      </main>
    )
  }

  // Si no pudimos comprobar la sesión, expulsar al login sería mentirle al
  // staff: puede tener sesión y estar sin red un momento.
  if (error) {
    return (
      <main className="page">
        <p className="alert alert-error" role="alert">
          {MESSAGES.sessionUnavailable}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Recargar
        </button>
      </main>
    )
  }

  if (!session) {
    return <Navigate to="/staff/login" replace />
  }

  return children
}
