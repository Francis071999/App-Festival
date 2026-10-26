import { useEffect, useState } from 'react'
import { supabase } from './supabase'

/**
 * Devuelve la sesión activa de Supabase, si todavía estamos resolviéndola y si
 * la comprobación falló.
 *
 * `loading` es importante: sin él, la primera renderización siempre ve
 * `session = null` y expulsaríamos al staff a /staff/login en cada recarga.
 * `error` también: si getSession() rechaza y no lo capturamos, `loading` queda
 * en true para siempre y la pantalla se queda en "Cargando…", sin salida.
 */
export function useSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return
        setSession(data.session ?? null)
        setError(false)
      })
      .catch(() => {
        if (!active) return
        setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession ?? null)
      setError(false)
      setLoading(false)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return { session, loading, error }
}
