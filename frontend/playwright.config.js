// Configuracion de Playwright (TP7). Dos tipos de prueba contra el ambiente QA ya desplegado:
//   - integracion: pedidos HTTP directos a la API (sin navegador)  -> proyecto "integracion"
//   - e2e:         un Chromium real que usa la pantalla del frontend -> proyecto "e2e"
// Las direcciones NO estan escritas aca: llegan por variables de entorno, para que la misma
// configuracion sirva contra QA (en el pipeline) o contra lo que levantes en tu maquina.
//   API_BASE_URL  -> la API   (ej. https://misgastos-api-qa.onrender.com)
//   E2E_BASE_URL  -> el front (ej. https://misgastos-front-qa.onrender.com)
// Como correrlas:  npm run test:integracion   /   npm run test:e2e
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Las pruebas viven en frontend/e2e/. Vitest (TP5) NO mira esta carpeta: ver vitest.config.js.
  testDir: './e2e',

  // Render Free "duerme" los servicios y el primer pedido puede tardar ~50 s (cold start).
  // Un test tiene hasta 90 s en total; cada aserción de pantalla espera hasta 15 s.
  timeout: 90_000,
  expect: { timeout: 15_000 },

  // Un reintento: absorbe un tropiezo de red o de arranque en frio sin esconder un fallo real
  // (si falla dos veces, el test queda rojo y el reintento queda registrado en el reporte).
  retries: 1,

  // Un test por vez: todos escriben en la misma base de QA (un solo Neon Free) y asi el
  // orden de lo que se crea y se borra es facil de seguir en el reporte.
  fullyParallel: false,
  workers: 1,

  // En el pipeline (CI=true) un test.only olvidado hace fallar la corrida en vez de
  // ejecutar un solo test y dar verde.
  forbidOnly: !!process.env.CI,

  // list: una linea por test en el log (termina con "N passed"). html: reporte navegable
  // (playwright-report/) que el pipeline sube como artifact; open:'never' evita abrir un servidor.
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    // Captura de pantalla solo cuando un test falla; traza (pasos, red, DOM) solo en el reintento.
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    // Margen para acciones (click, fill) y para cargar la pagina con el front/API dormidos.
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },

  projects: [
    {
      name: 'integracion',
      testMatch: /api\.spec\.js/,
      // Sin navegador: usa la fixture "request" de Playwright contra la API.
      use: { baseURL: process.env.API_BASE_URL },
    },
    {
      name: 'e2e',
      testMatch: /gastos\.spec\.js/,
      use: { ...devices['Desktop Chrome'], baseURL: process.env.E2E_BASE_URL },
    },
  ],
})
