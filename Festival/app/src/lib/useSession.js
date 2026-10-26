import { useEffect, useState } from 'react'
import { supabase } from './supabase'

/**
 * Devuelve la sesión activa de Supabase y si todavía estamos resolviéndola.
 * `loading` es importante: sin él, la primera renderización siempre ve
 * `session = null` y expulsaríamos al staff a /staff/login en cada recarga.
 */
export function useSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession ?? null)
      setLoading(false)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}
