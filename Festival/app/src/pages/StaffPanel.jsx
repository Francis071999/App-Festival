import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { config } from '../config'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import {
  VERIFICATION_LABELS,
  countRegistrations,
  listForStaff,
  verificationLabel,
} from '../lib/staff-list'

// Columnas justas: el staff no necesita el id de quien entregó ni la foto.
const COLUMNS =
  'id, full_name, dni, email, locality, ticket_delivered, delivered_at, locality_verified, verify_note, created_at'

const LOAD_ERROR = 'No pudimos cargar la lista. Revisá la conexión e intentá de nuevo.'

const formatDeliveredAt = (iso) => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

const fullDate = (iso) => {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('es-AR')
}

export default function StaffPanel() {
  const { session } = useSession()
  const navigate = useNavigate()

  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [signOutError, setSignOutError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(COLUMNS)
        .order('created_at')

      if (error) {
        setLoadError(LOAD_ERROR)
        return
      }

      setRows(data ?? [])
    } catch {
      setLoadError(LOAD_ERROR)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(() => listForStaff(rows, query), [rows, query])
  const counters = useMemo(() => countRegistrations(rows), [rows])

  async function handleSignOut() {
    setSignOutError('')
    try {
      await supabase.auth.signOut()
      navigate('/staff/login', { replace: true })
    } catch {
      setSignOutError('No pudimos cerrar la sesión. Revisá la conexión e intentá de nuevo.')
    }
  }

  const emptyMessage = rows.length === 0 ? 'Todavía no hay personas registradas.' : 'No se encontraron resultados.'

  return (
    <main className="page page-wide">
      <header className="staff-header">
        <div>
          <h1>{config.eventName}</h1>
          <p className="muted">Panel de staff · {session?.user?.email ?? 'sin email'}</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleSignOut}>
          Cerrar sesión
        </button>
      </header>

      {signOutError ? (
        <p className="alert alert-error" role="alert">
          {signOutError}
        </p>
      ) : null}

      <section className="counters" aria-label="Contadores">
        <div className="counter">
          <span className="counter-value">{counters.delivered}</span>
          <span className="counter-label">Entregadas</span>
        </div>
        <div className="counter">
          <span className="counter-value">{counters.verified}</span>
          <span className="counter-label">Verificadas</span>
        </div>
        <div className="counter">
          <span className="counter-value">{counters.registered}</span>
          <span className="counter-label">Registrados</span>
        </div>
      </section>

      <div className="search-bar">
        <div className="field">
          <label htmlFor="staff-search">Buscar por nombre o DNI</label>
          <div className="search-row">
            <input
              id="staff-search"
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="Ej: José o 30123456"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="alert alert-error" role="alert">
          <p>{loadError}</p>
          <button type="button" className="btn btn-secondary" onClick={() => void load()}>
            Reintentar
          </button>
        </div>
      ) : null}

      {loading && rows.length === 0 ? (
        <p className="muted" role="status">
          Cargando registros…
        </p>
      ) : null}

      {!loading && !loadError && visible.length === 0 ? (
        <p className="muted empty" role="status">
          {emptyMessage}
        </p>
      ) : null}

      {visible.length > 0 ? (
        <table className="reg-table">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">DNI</th>
              <th scope="col">Email</th>
              <th scope="col">Localidad</th>
              <th scope="col">Entrada</th>
              <th scope="col">Verificación</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                <td data-label="Nombre">{row.full_name}</td>
                <td data-label="DNI">{row.dni}</td>
                <td data-label="Email">{row.email || '—'}</td>
                <td data-label="Localidad">{row.locality}</td>
                <td data-label="Entrada">
                  <span
                    className={`badge ${row.ticket_delivered ? 'badge-ok' : 'badge-pending'}`}
                    title={fullDate(row.delivered_at)}
                  >
                    {row.ticket_delivered ? 'Entregada' : 'Pendiente'}
                  </span>
                  {row.delivered_at ? (
                    <span className="muted badge-time"> {formatDeliveredAt(row.delivered_at)}</span>
                  ) : null}
                </td>
                <td data-label="Verificación">
                  <span
                    className={`badge ${
                      row.locality_verified ? 'badge-ok' : 'badge-pending'
                    }`}
                    title={row.verify_note ?? ''}
                  >
                    {verificationLabel(row)}
                  </span>
                  {verificationLabel(row) === VERIFICATION_LABELS.exception && row.verify_note ? (
                    <span className="muted badge-time"> {row.verify_note}</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </main>
  )
}
