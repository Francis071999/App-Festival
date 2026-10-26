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
  email: '',
  address: '',
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const FIELD_NAMES = ['fullName', 'dni', 'locality', 'email', 'address']

function EventHeader() {
  return (
    <header className="page-header">
      {config.logoUrl ? <img className="logo" src={config.logoUrl} alt="" /> : null}
      <h1>{config.eventName}</h1>
      <p className="muted">{config.eventTagline}</p>
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
        // Sin este catch, un rechazo deja el botón deshabilitado para siempre.
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

  // Validación en vivo: al salir de un campo se valida ese campo.
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

    const payload = buildRegistrationPayload(values)
    setSubmitting(true)

    try {
      // Sin .select(): el usuario anónimo no tiene permiso de lectura.
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
      <main className="page">
        <EventHeader />
        <section className="card success" role="status">
          <h2>{MESSAGES.success}</h2>
          <p className="muted">Te esperamos en la puerta. Llevá tu DNI.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page">
      <EventHeader />

      <form className="card form" onSubmit={handleSubmit} onBlur={handleBlur} noValidate>
        <p className="muted form-intro">{config.eventDescription}</p>

        <div className="field">
          <label htmlFor="fullName">Nombre y apellido</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            maxLength={120}
            value={values.fullName}
            onChange={update('fullName')}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          />
          {errors.fullName ? (
            <p className="field-error" id="fullName-error">
              {errors.fullName}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="dni">DNI</label>
          <input
            id="dni"
            name="dni"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={values.dni}
            onChange={update('dni', (value) => value.replace(/\D/g, '').slice(0, 9))}
            aria-invalid={Boolean(errors.dni)}
            aria-describedby={errors.dni ? 'dni-error' : 'dni-hint'}
          />
          {errors.dni ? (
            <p className="field-error" id="dni-error">
              {errors.dni}
            </p>
          ) : (
            <p className="field-hint" id="dni-hint">
              Sin puntos, entre 7 y 9 dígitos.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="locality">Localidad</label>
          <select
            id="locality"
            name="locality"
            value={values.locality}
            onChange={update('locality')}
            disabled={loadingLocalities || Boolean(localitiesError) || noLocalities}
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
            <p className="field-error" id="locality-error">
              {errors.locality}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={values.email}
            onChange={update('email')}
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
          <label htmlFor="address">Domicilio declarado (opcional)</label>
          <input
            id="address"
            name="address"
            type="text"
            autoComplete="street-address"
            maxLength={120}
            value={values.address}
            onChange={update('address')}
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? 'address-error' : undefined}
          />
          {errors.address ? (
            <p className="field-error" id="address-error">
              {errors.address}
            </p>
          ) : null}
        </div>

        {/* Honeypot: nombre que el autofill del navegador no reconozca, para
            no bloquear a una persona real por accidente. */}
        <div className="hp" aria-hidden="true">
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
          <div className="alert alert-error" role="alert">
            <p>{localitiesError}</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setLocalitiesAttempt((attempt) => attempt + 1)}
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {noLocalities ? (
          <p className="alert alert-error" role="alert">
            {MESSAGES.noLocalities}
          </p>
        ) : null}

        {formError ? (
          <p className="alert alert-error" role="alert">
            {formError}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          {submitting ? 'Enviando…' : 'Registrarme'}
        </button>
      </form>
    </main>
  )
}
