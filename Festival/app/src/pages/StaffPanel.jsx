import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'

export default function StaffPanel() {
  const { session } = useSession()
  const navigate = useNavigate()
  const [signOutError, setSignOutError] = useState('')

  async function handleSignOut() {
    setSignOutError('')
    try {
      await supabase.auth.signOut()
      navigate('/staff/login', { replace: true })
    } catch {
      setSignOutError('No pudimos cerrar la sesión. Revisá la conexión e intentá de nuevo.')
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Panel de staff</h1>
        <p className="muted">Sesión: {session?.user?.email ?? 'sin email'}</p>
      </header>

      <section className="card">
        <p className="muted">
          La lista de asistentes, el buscador y la entrega de entradas llegan en
          el próximo paso.
        </p>
        {signOutError ? (
          <p className="alert alert-error" role="alert">
            {signOutError}
          </p>
        ) : null}
        <button type="button" className="btn btn-secondary" onClick={handleSignOut}>
          Cerrar sesión
        </button>
      </section>
    </main>
  )
}
