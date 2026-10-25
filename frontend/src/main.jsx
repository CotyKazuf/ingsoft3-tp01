// Debe ser lo PRIMERO que se importa (ver sentry.js).
import { Sentry } from './sentry'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root'), {
  // Errores que React captura al dibujar la pantalla: se mandan a Sentry (si esta activo).
  onUncaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
