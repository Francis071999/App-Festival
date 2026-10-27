import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import { MESSAGES, normalizeEmail } from '../lib/registration'
import { messageForAuthError, validateLogin } from '../lib/staff-auth'

export default function StaffLogin() {
  const { session, loading, error: sessionError } = useSession()
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
      <main style={{
        minHeight: '100vh',
        backgroundColor: '#120708',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: '#D4AF37', fontSize: '1rem' }} role="status">
          Cargando…
        </p>
      </main>
    )
  }

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#120708',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{
        backgroundColor: '#1D0E10',
        borderRadius: '1.25rem',
        padding: '2.5rem 2rem',
        maxWidth: '440px',
        width: '100%',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
        textAlign: 'center'
      }}>
        {/* LOGO DEL ANIVERSARIO - INCLUIDO ÚNICAMENTE EN LOGIN */}
        <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.75rem' }}>
          <img
            src="/img/muni aniversario.jpg"
            alt="Logo Bella Vista 150 Años"
            style={{
              height: '84px',
              width: '84px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #D4AF37',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
              marginBottom: '1rem'
            }}
          />
          <h1 style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: '#F3E5AB',
            margin: 0,
            lineHeight: 1.2
          }}>
            Ingreso de staff
          </h1>
          <p style={{
            fontSize: '0.8rem',
            color: '#D4AF37',
            margin: '0.35rem 0 0 0',
            fontWeight: 700,
            letterSpacing: '0.03em'
          }}>
            Solo para personas autorizadas por la organización.
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
          {sessionError ? (
            <p style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #f87171',
              borderRadius: '0.5rem',
              color: '#fca5a5',
              fontSize: '0.85rem',
              textAlign: 'center',
              margin: 0
            }} role="alert">
              {MESSAGES.sessionUnavailable}
            </p>
          ) : null}

          <div className="field">
            <label htmlFor="email" style={{
              display: 'block',
              fontWeight: 600,
              fontSize: '0.85rem',
              marginBottom: '0.375rem',
              color: '#C5A059',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}>
              Email
            </label>
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
              style={{
                width: '100%',
                padding: '0.75rem 0.875rem',
                borderRadius: '0.5rem',
                border: errors.email ? '1px solid #f87171' : '1px solid #4A2B20',
                outline: 'none',
                fontSize: '0.95rem',
                backgroundColor: '#120708',
                color: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
            {errors.email ? (
              <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.25rem' }} id="email-error">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="password" style={{
              display: 'block',
              fontWeight: 600,
              fontSize: '0.85rem',
              marginBottom: '0.375rem',
              color: '#C5A059',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}>
              Contraseña
            </label>
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
              style={{
                width: '100%',
                padding: '0.75rem 0.875rem',
                borderRadius: '0.5rem',
                border: errors.password ? '1px solid #f87171' : '1px solid #4A2B20',
                outline: 'none',
                fontSize: '0.95rem',
                backgroundColor: '#120708',
                color: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
            {errors.password ? (
              <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.25rem' }} id="password-error">
                {errors.password}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #f87171',
              borderRadius: '0.5rem',
              color: '#fca5a5',
              fontSize: '0.85rem',
              textAlign: 'center',
              margin: 0
            }} role="alert">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.875rem 1rem',
              background: submitting
                ? '#4A2B20'
                : 'linear-gradient(135deg, #D4AF37 0%, #F3E5AB 50%, #B8860B 100%)',
              color: submitting ? '#888888' : '#1D0E10',
              fontWeight: 800,
              fontSize: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting ? 'none' : '0 4px 15px rgba(212, 175, 55, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}