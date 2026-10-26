import { config } from '../config'

export default function Register() {
  return (
    <main className="page">
      <h1>{config.eventName}</h1>
      <p className="muted">{config.eventTagline}</p>
    </main>
  )
}
