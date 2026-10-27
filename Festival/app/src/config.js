// Configuración del evento. Este es el único archivo que hay que tocar
// para adaptar la app a otro evento: nombre, logo, color y reglas de negocio.

export const config = {
  eventName: 'Festival CIAC',
  eventTagline: 'Registrate para asegurar tu entrada.',
  eventDescription:
    'Completá tus datos y te esperamos para que retires tu entrada',
  logoUrl: '',
  accentColor: '#e11d48',

  // 'strict': si la localidad del DNI no coincide con la declarada, no se
  // entrega la entrada y queda registrada la incidencia con nota.
  // 'flexible': se entrega igual, pero queda marcada como excepción con nota.
  localityVerificationMode: 'strict',

  // Foto del reverso del DNI en el registro público. Requiere un bucket
  // privado en Supabase Storage con RLS. Desactivada por defecto.
  enableDniPhoto: false,

  // Anti-spam
  timeTrapMs: 3000,
  captcha: {
    enabled: false,
    provider: 'turnstile', // 'turnstile' | 'hcaptcha'
    siteKey: '',
  },

  // Sincronización del panel de staff
  staffRefreshIntervalMs: 30000,
}
