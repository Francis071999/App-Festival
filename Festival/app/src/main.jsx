import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { config } from './config'
import './index.css'

document.title = 'Aniversario Bella Vista'
document.documentElement.style.setProperty('--accent', config.accentColor)

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
