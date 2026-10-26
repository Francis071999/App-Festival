import { useEffect, useRef, useState } from 'react'
import { config } from '../config'
import { supabase } from '../lib/supabase'
import DniInputSection from '../components/DniInputSection'
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
  email: '',
  address: '',
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const FIELD_NAMES = ['fullName', 'dni', 'locality', 'email', 'address']

function EventHeader() {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      marginBottom: '1.75rem',
      textAlign: 'left'
    }}>
      {/* Logo de la Municipalidad de Bella Vista */}
      <img
        src="/img/logo muni.jpg"
        alt="Logo Municipalidad de Bella Vista"
        style={{
          height: '70px',
          width: '70px',
          borderRadius: '50%',
          objectFit: 'cover',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          flexShrink: 0
        }}
      />
      <div>
        <h1 style={{
          fontSize: '1.3rem',
          fontWeight: 800,
          color: '#0f172a',
          margin: 0,
          lineHeight: 1.2
        }}>
          Festival del Aniversario de los 150 años Bella Vista
        </h1>
        <p style={{
          fontSize: '0.85rem',
          color: '#0284c7',
          margin: '0.25rem 0 0 0',
          fontWeight: 600
        }}>
          Registrate para asegurar tu entrada
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
  const dniSectionRef = useRef()

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

  const setDni = (newDni) => {
    setValues((prev) => ({ ...prev, dni: newDni }))
    setErrors((prev) => (prev.dni ? { ...prev, dni: undefined } : prev))
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
      let dniPhotoUrl = null
      if (dniSectionRef.current) {
        dniPhotoUrl = await dniSectionRef.current.uploadFoto()
      }

      const payload = {
        ...buildRegistrationPayload(values),
        dni_photo_url: dniPhotoUrl,
      }

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
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '2.5rem',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          textAlign: 'center'
        }}>
          <EventHeader />
          <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #bbf7d0' }}>
            <h2 style={{ color: '#166534', margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{MESSAGES.success}</h2>
            <p style={{ color: '#15803d', margin: 0, fontSize: '0.9rem' }}>Te esperamos en la puerta. Llevá tu DNI.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
      }}>
        <EventHeader />

        <form onSubmit={handleSubmit} onBlur={handleBlur} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            {config.eventDescription || 'Completá tus datos y te esperamos en la puerta con tu entrada.'}
          </p>

          <div className="field">
            <label htmlFor="fullName" style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.375rem', color: '#1e293b' }}>
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
                border: errors.fullName ? '1px solid #ef4444' : '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '0.95rem'
              }}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            />
            {errors.fullName ? (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }} id="fullName-error">
                {errors.fullName}
              </p>
            ) : null}
          </div>

          <DniInputSection
            ref={dniSectionRef}
            dni={values.dni}
            setDni={setDni}
            error={errors.dni}
          />

          <div className="field">
            <label htmlFor="locality" style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.375rem', color: '#1e293b' }}>
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
                border: errors.locality ? '1px solid #ef4444' : '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '0.95rem',
                backgroundColor: '#ffffff'
              }}
              aria-invalid={Boolean(errors.locality)}
              aria-describedby={errors.locality ? 'locality-error' : undefined}
            >
              <option value="">
                {loadingLocalities ? 'Cargando localidades…' : 'Elegí tu localidad'}
              </option>
              {localities.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {errors.locality ? (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }} id="locality-error">
                {errors.locality}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="email" style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.375rem', color: '#1e293b' }}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={values.email}
              onChange={update('email')}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: '0.5rem',
                border: errors.email ? '1px solid #ef4444' : '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '0.95rem'
              }}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email ? (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }} id="email-error">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="address" style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.375rem', color: '#1e293b' }}>
              Domicilio declarado (opcional)
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
                border: errors.address ? '1px solid #ef4444' : '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '0.95rem'
              }}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? 'address-error' : undefined}
            />
            {errors.address ? (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }} id="address-error">
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
            <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem' }}>
              <p style={{ color: '#991b1b', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>{localitiesError}</p>
              <button
                type="button"
                onClick={() => setLocalitiesAttempt((attempt) => attempt + 1)}
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {noLocalities ? (
            <p style={{ color: '#991b1b', fontSize: '0.85rem', margin: 0 }}>
              {MESSAGES.noLocalities}
            </p>
          ) : null}

          {formError ? (
            <p style={{ color: '#991b1b', fontSize: '0.85rem', margin: 0 }}>
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: canSubmit ? '#0284c7' : '#94a3b8',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s ease'
            }}
          >
            {submitting ? 'Enviando…' : 'Registrarme'}
          </button>
        </form>
      </div>
    </main>
  )
}