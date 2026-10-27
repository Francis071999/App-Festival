import { useEffect, useRef, useState } from 'react'
import { config } from '../config'
import { supabase } from '../lib/supabase'
import {
  MESSAGES,
  RETRY_DELAYS_MS,
  buildRegistrationPayload,
  isNetworkError,
  messageForInsertError,
  planSubmit,
  validateRegistration,
} from '../lib/registration'

const EMPTY_VALUES = {
  fullName: '',
  dni: '',
  locality: '',
  phone: '',
  address: '',
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const FIELD_NAMES = ['fullName', 'dni', 'locality', 'phone', 'address']

function EventHeader() {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.25rem',
      marginBottom: '1.75rem',
      textAlign: 'left'
    }}>
      {/* Nuevo Logo 150 Años Aniversario */}
      <img
        src="/img/muni aniversario.jpg"
        alt="Logo Bella Vista 150 Años"
        style={{
          height: '80px',
          width: '80px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid #D4AF37',
          boxShadow: '0 4px 12px rgba(212, 175, 55, 0.25)',
          flexShrink: 0
        }}
      />
      <div>
        <h1 style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#F3E5AB',
          margin: 0,
          lineHeight: 1.25,
          letterSpacing: '0.02em'
        }}>
          Festival Aniversario 150 Años
        </h1>
        <p style={{
          fontSize: '0.85rem',
          color: '#D4AF37',
          margin: '0.25rem 0 0 0',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Bella Vista • 1876-2026
        </p>
      </div>
    </header>
  )
}

export default function Register() {
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [localities, setLocalities] = useState([])
  const [localitiesError, setLocalitiesError] = useState('')
  const [loadingLocalities, setLoadingLocalities] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [localitiesAttempt, setLocalitiesAttempt] = useState(0)
  const mountedAt = useRef(Date.now())
  const honeypot = useRef('')

  useEffect(() => {
    let active = true
    setLoadingLocalities(true)
    setLocalitiesError('')

    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('localities')
          .select('name')
          .order('name')
        if (!active) return
        if (error) {
          setLocalitiesError(MESSAGES.localitiesUnavailable)
        } else {
          setLocalities((data ?? []).map((row) => row.name))
        }
      } catch {
        if (active) setLocalitiesError(MESSAGES.localitiesUnavailable)
      } finally {
        if (active) setLoadingLocalities(false)
      }
    })()

    return () => {
      active = false
    }
  }, [localitiesAttempt])

  const update = (field, transform) => (event) => {
    const value = transform ? transform(event.target.value) : event.target.value
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
    if (formError) setFormError('')
  }

  const handleBlur = (event) => {
    const { name } = event.target
    if (!FIELD_NAMES.includes(name)) return
    const nextErrors = validateRegistration(values)
    setErrors((prev) => ({ ...prev, [name]: nextErrors[name] }))
  }

  const noLocalities = !loadingLocalities && !localitiesError && localities.length === 0
  const canSubmit = !submitting && !loadingLocalities && !localitiesError && !noLocalities

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return
    setFormError('')

    const plan = planSubmit({
      values,
      honeypot: honeypot.current,
      elapsedMs: Date.now() - mountedAt.current,
      timeTrapMs: config.timeTrapMs,
    })

    if (plan.action === 'blocked') {
      setFormError(plan.message)
      return
    }

    if (plan.action === 'invalid') {
      setErrors(plan.errors)
      document.getElementById(Object.keys(plan.errors)[0])?.focus()
      return
    }

    setSubmitting(true)

    try {
      const payload = buildRegistrationPayload(values)

      let result = await supabase.from('registrations').insert(payload)
      let retried = false

      for (const delay of RETRY_DELAYS_MS) {
        if (!result.error || !isNetworkError(result.error)) break
        retried = true
        await sleep(delay)
        result = await supabase.from('registrations').insert(payload)
      }

      if (result.error) {
        setFormError(messageForInsertError(result.error, { retried }))
        return
      }

      setRegistered(true)
    } catch {
      setFormError(MESSAGES.generic)
    } finally {
      setSubmitting(false)
    }
  }

  if (registered) {
    return (
      <main style={{
        minHeight: '100vh',
        backgroundColor: '#120708',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}>
        <div style={{
          backgroundColor: '#1D0E10',
          borderRadius: '1rem',
          padding: '2.5rem',
          maxWidth: '480px',
          width: '100%',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 20px 30px rgba(0, 0, 0, 0.7)',
          textAlign: 'center'
        }}>
          <EventHeader />
          <div style={{
            padding: '1.25rem',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            borderRadius: '0.75rem',
            border: '1px solid #D4AF37'
          }}>
            <h2 style={{ color: '#F3E5AB', margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>
              {MESSAGES.success}
            </h2>
            <p style={{ color: '#D1C7BD', margin: 0, fontSize: '0.9rem' }}>
              Te esperamos en la puerta. Llevá tu DNI.
            </p>
          </div>
        </div>
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
        padding: '2rem',
        maxWidth: '520px',
        width: '100%',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)'
      }}>
        <EventHeader />

        <form onSubmit={handleSubmit} onBlur={handleBlur} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#D1C7BD', margin: 0, textAlign: 'center' }}>
            {config.eventDescription || 'Completá tus datos y te esperamos en la puerta con tu entrada.'}
          </p>

          <div className="field">
            <label htmlFor="fullName" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#C5A059', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Nombre y apellido
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              maxLength={120}
              value={values.fullName}
              onChange={update('fullName')}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: '0.5rem',
                border: errors.fullName ? '1px solid #f87171' : '1px solid #4A2B20',
                outline: 'none',
                fontSize: '0.95rem',
                backgroundColor: '#120708',
                color: '#ffffff',
                boxSizing: 'border-box'
              }}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            />
            {errors.fullName ? (
              <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.25rem' }} id="fullName-error">
                {errors.fullName}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="dni" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#C5A059', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              DNI
            </label>
            <input
              id="dni"
              name="dni"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={9}
              value={values.dni}
              onChange={update('dni', (value) => value.replace(/\D/g, '').slice(0, 9))}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: '0.5rem',
                border: errors.dni ? '1px solid #f87171' : '1px solid #4A2B20',
                outline: 'none',
                fontSize: '0.95rem',
                backgroundColor: '#120708',
                color: '#ffffff',
                boxSizing: 'border-box'
              }}
              aria-invalid={Boolean(errors.dni)}
              aria-describedby={errors.dni ? 'dni-error' : 'dni-hint'}
            />
            {errors.dni ? (
              <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.25rem' }} id="dni-error">
                {errors.dni}
              </p>
            ) : (
              <p style={{ color: '#A39688', fontSize: '0.8rem', marginTop: '0.25rem' }} id="dni-hint">
                Sin puntos, entre 7 y 9 dígitos.
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="locality" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#C5A059', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Localidad
            </label>
            <select
              id="locality"
              name="locality"
              value={values.locality}
              onChange={update('locality')}
              disabled={loadingLocalities || Boolean(localitiesError) || noLocalities}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: '0.5rem',
                border: errors.locality ? '1px solid #f87171' : '1px solid #4A2B20',
                outline: 'none',
                fontSize: '0.95rem',
                backgroundColor: '#120708',
                color: '#ffffff',
                boxSizing: 'border-box'
              }}
              aria-invalid={Boolean(errors.locality)}
              aria-describedby={errors.locality ? 'locality-error' : undefined}
            >
              <option value="" style={{ backgroundColor: '#120708', color: '#ffffff' }}>
                {loadingLocalities ? 'Cargando localidades…' : 'Elegí tu localidad'}
              </option>
              {localities.map((name) => (
                <option key={name} value={name} style={{ backgroundColor: '#120708', color: '#ffffff' }}>
                  {name}
                </option>
              ))}
            </select>
            {errors.locality ? (
              <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.25rem' }} id="locality-error">
                {errors.locality}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="phone" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#C5A059', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Número de celular
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              maxLength={20}
              placeholder="Ej: 3811234567"
              value={values.phone}
              onChange={update('phone')}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: '0.5rem',
                border: errors.phone ? '1px solid #f87171' : '1px solid #4A2B20',
                outline: 'none',
                fontSize: '0.95rem',
                backgroundColor: '#120708',
                color: '#ffffff',
                boxSizing: 'border-box'
              }}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
            />
            {errors.phone ? (
              <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.25rem' }} id="phone-error">
                {errors.phone}
              </p>
            ) : (
              <p style={{ color: '#A39688', fontSize: '0.8rem', marginTop: '0.25rem' }} id="phone-hint">
                Con código de área, sin 0 ni 15.
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="address" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#C5A059', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Domicilio declarado 
            </label>
            <input
              id="address"
              name="address"
              type="text"
              autoComplete="street-address"
              maxLength={120}
              value={values.address}
              onChange={update('address')}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: '0.5rem',
                border: errors.address ? '1px solid #f87171' : '1px solid #4A2B20',
                outline: 'none',
                fontSize: '0.95rem',
                backgroundColor: '#120708',
                color: '#ffffff',
                boxSizing: 'border-box'
              }}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? 'address-error' : undefined}
            />
            {errors.address ? (
              <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.25rem' }} id="address-error">
                {errors.address}
              </p>
            ) : null}
          </div>

          {/* Honeypot */}
          <div className="hp" aria-hidden="true" style={{ display: 'none' }}>
            <label htmlFor="hp-field">No completar</label>
            <input
              id="hp-field"
              name="hp-field"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              onChange={(event) => {
                honeypot.current = event.target.value
              }}
            />
          </div>

          {localitiesError ? (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #f87171', borderRadius: '0.5rem' }}>
              <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>{localitiesError}</p>
              <button
                type="button"
                onClick={() => setLocalitiesAttempt((attempt) => attempt + 1)}
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem', borderRadius: '0.375rem', cursor: 'pointer', backgroundColor: '#D4AF37', border: 'none', fontWeight: 600, color: '#120708' }}
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {noLocalities ? (
            <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: 0 }}>
              {MESSAGES.noLocalities}
            </p>
          ) : null}

          {formError ? (
            <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: 0 }}>
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.875rem 1rem',
              background: canSubmit
                ? 'linear-gradient(135deg, #D4AF37 0%, #F3E5AB 50%, #B8860B 100%)'
                : '#4A2B20',
              color: canSubmit ? '#1D0E10' : '#888888',
              fontWeight: 800,
              fontSize: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? '0 4px 15px rgba(212, 175, 55, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {submitting ? 'Enviando…' : 'Registrarme'}
          </button>
        </form>
      </div>
    </main>
  )
}