import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { config } from '../config'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import { ACTION_MESSAGES, planTicketAction, ticketPayload } from '../lib/staff-actions'
import {
  VERIFICATION_LABELS,
  countRegistrations,
  listForStaff,
  verificationLabel,
} from '../lib/staff-list'

// Columnas justas: el staff no necesita el id de quien entregó ni la foto.
const COLUMNS =
  'id, full_name, dni, phone, locality, ticket_delivered, delivered_at, locality_verified, verify_note, created_at'

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
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [confirming, setConfirming] = useState(null)

  const strict = config.localityVerificationMode === 'strict'

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

  async function commitAction(row, action) {
    setActionError('')
    setConfirming(null)
    setBusyId(row.id)

    try {
      // El trigger de la base completa delivered_at y delivered_by.
      const { data, error } = await supabase
        .from('registrations')
        .update(ticketPayload(action === 'deliver'))
        .eq('id', row.id)
        .select(COLUMNS)
        .single()

      if (error || !data) {
        setActionError(ACTION_MESSAGES.saveError)
        return
      }

      setRows((previous) => previous.map((item) => (item.id === row.id ? data : item)))
    } catch {
      setActionError(ACTION_MESSAGES.saveError)
    } finally {
      setBusyId('')
    }
  }

  function requestAction(row, action) {
    const plan = planTicketAction(row, action, { strict })
    if (!plan.allowed) return

    if (plan.confirmation) {
      setConfirming({ row, action, message: plan.confirmation })
      return
    }

    void commitAction(row, action)
  }

  const emptyMessage =
    rows.length === 0 ? 'Todavía no hay personas registradas.' : 'No se encontraron resultados.'

  return (
    <main style={{ backgroundColor: '#120708', minHeight: '100vh', color: '#F9F6F0', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* CABECERA (SIN LOGO) */}
        <header style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          backgroundColor: '#1D0E10',
          padding: '1.25rem 1.5rem',
          borderRadius: '1rem',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#F3E5AB' }}>
              Aniversario Bella Vista
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#D4AF37', fontWeight: 600 }}>
              Panel de staff · {session?.user?.email ?? 'sin email'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #f87171',
              color: '#fca5a5',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Cerrar sesión
          </button>
        </header>

        {signOutError ? (
          <p style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #f87171',
            borderRadius: '0.5rem',
            color: '#fca5a5',
            marginBottom: '1rem'
          }} role="alert">
            {signOutError}
          </p>
        ) : null}

        {/* TARJETAS DE CONTADORES */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }} aria-label="Contadores">
          <div style={{
            backgroundColor: '#1D0E10',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            textAlign: 'center'
          }}>
            <span style={{ display: 'block', fontSize: '2rem', fontWeight: 800, color: '#F3E5AB' }}>
              {counters.delivered}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#C5A059', textTransform: 'uppercase', fontWeight: 700 }}>
              Entregadas
            </span>
          </div>

          <div style={{
            backgroundColor: '#1D0E10',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            textAlign: 'center'
          }}>
            <span style={{ display: 'block', fontSize: '2rem', fontWeight: 800, color: '#F3E5AB' }}>
              {counters.verified}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#C5A059', textTransform: 'uppercase', fontWeight: 700 }}>
              Verificadas
            </span>
          </div>

          <div style={{
            backgroundColor: '#1D0E10',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            textAlign: 'center'
          }}>
            <span style={{ display: 'block', fontSize: '2rem', fontWeight: 800, color: '#F3E5AB' }}>
              {counters.registered}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#C5A059', textTransform: 'uppercase', fontWeight: 700 }}>
              Registrados
            </span>
          </div>
        </section>

        {/* BUSCADOR Y BOTÓN REFRESH */}
        <div style={{
          backgroundColor: '#1D0E10',
          padding: '1.25rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          marginBottom: '1.5rem'
        }}>
          <label htmlFor="staff-search" style={{ display: 'block', fontSize: '0.8rem', color: '#C5A059', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
            Buscar por nombre o DNI
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              id="staff-search"
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="Ej: José o 30123456"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                borderRadius: '0.5rem',
                border: '1px solid #4A2B20',
                outline: 'none',
                backgroundColor: '#120708',
                color: '#ffffff',
                fontSize: '0.95rem'
              }}
            />
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid #D4AF37',
                color: '#F3E5AB',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
        </div>

        {actionError ? (
          <p style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #f87171',
            borderRadius: '0.5rem',
            color: '#fca5a5',
            marginBottom: '1rem'
          }} role="alert">
            {actionError}
          </p>
        ) : null}

        {loadError ? (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #f87171',
            borderRadius: '0.5rem',
            color: '#fca5a5',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }} role="alert">
            <p style={{ margin: 0 }}>{loadError}</p>
            <button
              type="button"
              onClick={() => void load()}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '0.375rem', backgroundColor: '#D4AF37', border: 'none', color: '#120708', fontWeight: 700, cursor: 'pointer' }}
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {loading && rows.length === 0 ? (
          <p style={{ color: '#D4AF37', textAlign: 'center', padding: '2rem 0' }} role="status">
            Cargando registros…
          </p>
        ) : null}

        {!loading && !loadError && visible.length === 0 ? (
          <p style={{ color: '#A39688', textAlign: 'center', padding: '2rem 0' }} role="status">
            {emptyMessage}
          </p>
        ) : null}

        {/* TABLA ESTILIZADA */}
        {visible.length > 0 ? (
          <div style={{
            backgroundColor: '#1D0E10',
            borderRadius: '1rem',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            overflowX: 'auto',
            boxShadow: '0 15px 30px rgba(0,0,0,0.7)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#281518', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', color: '#C5A059' }}>
                  <th scope="col" style={{ padding: '1rem' }}>Nombre</th>
                  <th scope="col" style={{ padding: '1rem' }}>DNI</th>
                  <th scope="col" style={{ padding: '1rem' }}>Celular</th>
                  <th scope="col" style={{ padding: '1rem' }}>Localidad</th>
                  <th scope="col" style={{ padding: '1rem' }}>Entrada</th>
                  <th scope="col" style={{ padding: '1rem' }}>Verificación</th>
                  <th scope="col" style={{ padding: '1rem' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row, index) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
                      backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <td data-label="Nombre" style={{ padding: '1rem', fontWeight: 600, color: '#F9F6F0' }}>{row.full_name}</td>
                    <td data-label="DNI" style={{ padding: '1rem', color: '#D4AF37', fontWeight: 700 }}>{row.dni}</td>
                    <td data-label="Celular" style={{ padding: '1rem', color: '#D1C7BD' }}>{row.phone || '—'}</td>
                    <td data-label="Localidad" style={{ padding: '1rem', color: '#D1C7BD' }}>{row.locality}</td>
                    <td data-label="Entrada" style={{ padding: '1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: row.ticket_delivered ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: row.ticket_delivered ? '#4ade80' : '#fbbf24',
                          border: row.ticket_delivered ? '1px solid #22c55e' : '1px solid #f59e0b'
                        }}
                        title={fullDate(row.delivered_at)}
                      >
                        {row.ticket_delivered ? 'Entregada' : 'Pendiente'}
                      </span>
                      {row.delivered_at ? (
                        <span style={{ fontSize: '0.75rem', color: '#888888', marginLeft: '0.4rem' }}>
                          {formatDeliveredAt(row.delivered_at)}
                        </span>
                      ) : null}
                    </td>
                    <td data-label="Verificación" style={{ padding: '1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: row.locality_verified ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: row.locality_verified ? '#4ade80' : '#fbbf24',
                          border: row.locality_verified ? '1px solid #22c55e' : '1px solid #f59e0b'
                        }}
                        title={row.verify_note ?? ''}
                      >
                        {verificationLabel(row)}
                      </span>
                      {verificationLabel(row) === VERIFICATION_LABELS.exception && row.verify_note ? (
                        <span style={{ fontSize: '0.75rem', color: '#888888', marginLeft: '0.4rem' }}>
                          {row.verify_note}
                        </span>
                      ) : null}
                    </td>
                    <td data-label="Acción" style={{ padding: '1rem' }}>
                      {row.ticket_delivered ? (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => requestAction(row, 'undo')}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.75rem',
                            borderRadius: '0.375rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid #4A2B20',
                            color: '#D1C7BD',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: busyId === row.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {busyId === row.id ? 'Guardando…' : 'Deshacer'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => requestAction(row, 'deliver')}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.75rem',
                            borderRadius: '0.375rem',
                            background: busyId === row.id ? '#4A2B20' : 'linear-gradient(135deg, #D4AF37 0%, #F3E5AB 50%, #B8860B 100%)',
                            border: 'none',
                            color: busyId === row.id ? '#888888' : '#1D0E10',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            cursor: busyId === row.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {busyId === row.id ? 'Guardando…' : 'Entregar entrada'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* MODAL / DE BARRA DE CONFIRMACIÓN DE ACCIÓN */}
        {confirming ? (
          <div style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1D0E10',
            border: '1px solid #D4AF37',
            borderRadius: '0.75rem',
            padding: '1rem 1.5rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            zIndex: 1000,
            maxWidth: '90%',
            width: '600px'
          }} role="alertdialog" aria-label="Confirmar acción">
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#F9F6F0', flex: 1 }}>
              <strong style={{ color: '#F3E5AB' }}>{confirming.row.full_name}</strong> — {confirming.message}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => void commitAction(confirming.row, confirming.action)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '0.375rem',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F3E5AB 50%, #B8860B 100%)',
                  border: 'none',
                  color: '#1D0E10',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Sí, {confirming.action === 'deliver' ? 'entregar' : 'deshacer'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'transparent',
                  border: '1px solid #4A2B20',
                  color: '#D1C7BD',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}

      </div>
    </main>
  )
}