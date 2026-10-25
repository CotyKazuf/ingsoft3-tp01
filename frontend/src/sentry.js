// Inicializacion de Sentry en el navegador (errores de React + performance de la pagina).
// Se importa como PRIMERA linea de main.jsx, antes de que arranque React.
import * as Sentry from '@sentry/react'

// DSN PUBLICO del proyecto "frontend" de Sentry. NO es un secreto: va dentro del JavaScript
// que baja el navegador (cualquiera lo ve en las herramientas del navegador) y solo permite
// ENVIAR eventos a ese proyecto, no leer nada. Lo que SI es secreto (y no va nunca al
// repositorio) es el auth token / API key privada de Sentry, que sirve para leer y administrar.
// Si esta vacio, Sentry queda apagado (no se envia nada).
const DSN_PUBLICO =
  'https://74350e5b1d0d5a48d432e4c4d8750403@o4512314364657664.ingest.us.sentry.io/4512314396639232'

// "Build once, deploy many": la MISMA imagen de este frontend se usa en QA y en PROD, asi que el
// entorno no puede quedar fijado al compilar. Se deduce de la direccion desde la que se abre.
const ENTORNO_POR_HOST = {
  'misgastos-front-prod.onrender.com': 'production',
  'misgastos-front-qa.onrender.com': 'qa',
  localhost: 'development',
}
const entorno = ENTORNO_POR_HOST[window.location.hostname] ?? 'unknown'

// Solo reporta desde produccion: QA, desarrollo local y las pruebas e2e (que corren contra QA)
// no deben mezclarse con el uso real. Para reportar tambien desde QA bastaria agregar 'qa' aqui.
const ENTORNOS_QUE_REPORTAN = ['production']

if (DSN_PUBLICO && ENTORNOS_QUE_REPORTAN.includes(entorno)) {
  Sentry.init({
    dsn: DSN_PUBLICO,
    environment: entorno,

    // Performance de la pagina (carga y navegacion entre pantallas) y de las llamadas a /api.
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
    // Solo se agrega el encabezado de trazado a las llamadas a /api (mismo origen, via nginx):
    // asi un request del navegador se une con su request en el backend.
    tracePropagationTargets: [/^\/api\//],

    // Privacidad: sin datos del usuario, cookies ni cuerpos de requests/responses (ahi viajan
    // las descripciones de los gastos).
    sendDefaultPii: false,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpBodies: [],
    },
  })
}

export { Sentry }
