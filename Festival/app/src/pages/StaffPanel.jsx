import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'

export default function StaffPanel() {
  const { session } = useSession()
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/staff/login', { replace: true })
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Panel de staff</h1>
        <p className="muted">
          Sesión: {session?.user?.email ?? 'sin email'}
        </p>
      </header>

      <section className="card">
        <p className="muted">
          La lista de asistentes, el buscador y la entrega de entradas llegan en
          el próximo paso.
        </p>
        <button type="button" className="btn btn-secondary" onClick={handleSignOut}>
          Cerrar sesión
        </button>
      </section>
    </main>
  )
}
