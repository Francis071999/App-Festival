import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import { normalizeEmail } from '../lib/registration'
import { messageForAuthError, validateLogin } from '../lib/staff-auth'

export default function StaffLogin() {
  const { session, loading } = useSession()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Si ya hay sesión, no tiene sentido mostrar el formulario.
  useEffect(() => {
    if (!loading && session) navigate('/staff', { replace: true })
  }, [loading, session, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    setFormError('')

    const nextErrors = validateLogin({ email, password })
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      document.getElementById(Object.keys(nextErrors)[0])?.focus()
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      })

      if (error) {
        setFormError(messageForAuthError(error))
        document.getElementById('password')?.focus()
        return
      }

      navigate('/staff', { replace: true })
    } catch {
      setFormError(messageForAuthError(null))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="page">
        <p className="muted" role="status">
          Cargando…
        </p>
      </main>
    )
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Ingreso de staff</h1>
        <p className="muted">Solo para personas autorizadas por la organización.</p>
      </header>

      <form className="card form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            autoFocus
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setErrors((prev) => ({ ...prev, email: undefined }))
              if (formError) setFormError('')
            }}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email ? (
            <p className="field-error" id="email-error">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setErrors((prev) => ({ ...prev, password: undefined }))
              if (formError) setFormError('')
            }}
            aria-invalid={Boolean(errors.password) || Boolean(formError)}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password ? (
            <p className="field-error" id="password-error">
              {errors.password}
            </p>
          ) : null}
        </div>

        {formError ? (
          <p className="alert alert-error" role="alert">
            {formError}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
