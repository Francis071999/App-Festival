import { Navigate } from 'react-router-dom'
import { useSession } from '../lib/useSession'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useSession()

  if (loading) {
    return (
      <main className="page">
        <p className="muted" role="status">
          Cargando…
        </p>
      </main>
    )
  }

  if (!session) {
    return <Navigate to="/staff/login" replace />
  }

  return children
}
