// Pruebas E2E de Mis Gastos (TP7): un Chromium REAL maneja la pantalla del frontend desplegado,
// que habla con la API real y la base real (en el pipeline: el ambiente QA). Sin mocks:
// no se intercepta ningun pedido (nada de page.route) y no se saltea ningun test.
//
// Direccion del frontend: variable E2E_BASE_URL (ej. https://misgastos-front-qa.onrender.com).
// En tu maquina, si no la definis, usa http://localhost:8080 (docker compose up -d --build).
import { test, expect } from '@playwright/test'

const FRONT = process.env.E2E_BASE_URL || 'http://localhost:8080'

// En el pipeline (CI=true) no se admite el fallback a localhost: sin la variable, una corrida
// "verde" podria estar probando cualquier cosa menos QA.
if (process.env.CI && !process.env.E2E_BASE_URL) {
  throw new Error('Falta E2E_BASE_URL: el pipeline tiene que apuntar al frontend de QA.')
}

// Pisa el baseURL del proyecto en playwright.config.js (para que valga el fallback local).
test.use({ baseURL: FRONT })

// ---------------------------------------------------------------------------------------
// Ayudas
// ---------------------------------------------------------------------------------------

// Nombre unico por test y por corrida: cada test busca en pantalla SOLO su propio gasto,
// aunque la base de QA tenga otros.
const unico = (prefijo) => `e2e-${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// La app solo acepta fechas del año actual y no futuras: 1 de enero de este año es siempre valida.
const ANIO = new Date().getFullYear()
const FECHA = `${ANIO}-01-01`
const FECHA_EN_PANTALLA = `01/01/${ANIO}` // asi la muestra la lista

// Lo que cada test creo y todavia no borro. Si un test falla a la mitad, afterEach lo limpia
// igual (red de seguridad: el borrado "de verdad" de cada flujo se hace por pantalla).
let descripciones = []
let marcadores = []

test.beforeEach(() => {
  descripciones = []
  marcadores = []
})

test.afterEach(async ({ request }) => {
  const res = await request.get('/api/gastos', { timeout: 30_000 })
  if (!res.ok()) return
  for (const g of await res.json()) {
    if (descripciones.includes(g.descripcion) || marcadores.includes(g.tarjeta)) {
      await request.delete(`/api/gastos/${g.id}`, { timeout: 30_000 })
    }
  }
})

// Render Free duerme los servicios: el primer pedido puede tardar ~50 s. Se "despierta" una sola
// vez el frontend (nginx) y, a traves de el, la API y la base, antes del primer test.
test.beforeAll(async ({ playwright }) => {
  test.setTimeout(240_000)
  const ctx = await playwright.request.newContext({ baseURL: FRONT })
  try {
    await expect(async () => {
      const res = await ctx.get('/api/gastos', { timeout: 30_000 }) // front -> API -> base de datos
      expect(res.status()).toBe(200)
    }).toPass({ timeout: 200_000, intervals: [2_000, 5_000, 10_000] })
  } finally {
    await ctx.dispose()
  }
})

async function abrirMisGastos(page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Mis Gastos/ })).toBeVisible()
}

// La fila de la lista que contiene mi descripcion (cada gasto es un <li> de la lista).
const filaDe = (page, descripcion) => page.getByRole('listitem').filter({ hasText: descripcion })

// Llena el formulario como lo haria una persona: escribe, elige en los desplegables.
async function completarFormulario(page, datos) {
  await page.getByLabel('Descripción', { exact: true }).fill(datos.descripcion)
  await page.getByLabel('Monto', { exact: true }).fill(String(datos.monto))
  await page.getByLabel('Categoría', { exact: true }).selectOption(datos.categoria)
  await page.getByLabel('Fecha', { exact: true }).fill(FECHA)
  await page.getByLabel('Medio de pago', { exact: true }).selectOption(datos.medioPago)
  if (datos.medioPago === 'Tarjeta') {
    await page.getByLabel('Nombre de la tarjeta', { exact: true }).fill(datos.tarjeta)
    await page.getByLabel('Tipo', { exact: true }).selectOption('Débito')
  }
}

// Desde la pantalla principal: "Agregar gasto" -> formulario -> completar -> enviar.
async function agregarGasto(page, datos) {
  await page.getByRole('button', { name: 'Agregar gasto' }).click()
  await expect(page.getByRole('heading', { name: 'Agregar gasto' })).toBeVisible()
  await completarFormulario(page, datos)
  await page.getByRole('button', { name: 'Agregar gasto' }).click() // el boton de enviar del formulario
}

// Consulta a la API (a traves del mismo frontend/nginx) si todavia existe un gasto con esa descripcion.
async function existeEnLaBase(request, descripcion) {
  const res = await request.get('/api/gastos', { timeout: 30_000 })
  expect(res.status()).toBe(200)
  return (await res.json()).some((g) => g.descripcion === descripcion)
}

// ---------------------------------------------------------------------------------------
// Flujos
// ---------------------------------------------------------------------------------------

test('flujo 1: crear un gasto desde la pantalla, verlo en la lista y eliminarlo', async ({ page, request }) => {
  const descripcion = unico('crud')
  descripciones.push(descripcion)

  await abrirMisGastos(page)
  await agregarGasto(page, { descripcion, monto: 321, categoria: 'Transporte', medioPago: 'Transferencia' })

  // Al guardar vuelve a la lista y MI gasto aparece, con lo que cargue.
  const fila = filaDe(page, descripcion)
  await expect(fila).toHaveCount(1)
  await expect(fila).toContainText('Transporte')
  await expect(fila).toContainText(`Transferencia · ${FECHA_EN_PANTALLA}`)
  await expect(fila).toContainText('$321')

  // Eliminar ESE gasto: el boton de su propia fila.
  await fila.getByRole('button', { name: 'Eliminar' }).click()

  // Limpieza verificada: desaparece de la pantalla y tampoco esta en la base.
  await expect(filaDe(page, descripcion)).toHaveCount(0)
  expect(await existeEnLaBase(request, descripcion)).toBe(false)
})

test('flujo 2: un gasto invalido muestra el error y no se guarda', async ({ page, request }) => {
  // Regla real: la descripcion es obligatoria. Con solo espacios el navegador deja enviar el
  // formulario (para el no esta vacia) y es el BACKEND quien rechaza con 400. Como no hay
  // descripcion para reconocer la fila, uso un marcador unico en "Nombre de la tarjeta".
  const marcador = unico('invalido')
  marcadores.push(marcador)

  await abrirMisGastos(page)
  await agregarGasto(page, {
    descripcion: '   ',
    monto: 55,
    categoria: 'Comida',
    medioPago: 'Tarjeta',
    tarjeta: marcador,
  })

  // La persona ve el mensaje del backend y sigue en el formulario (no se guardo ni se la saco de ahi).
  await expect(page.getByRole('alert')).toHaveText('La descripción es obligatoria')
  await expect(page.getByRole('heading', { name: 'Agregar gasto' })).toBeVisible()

  // Verificado en la base real: no se creo ningun gasto con mi marcador.
  const res = await request.get('/api/gastos', { timeout: 30_000 })
  expect(res.status()).toBe(200)
  expect((await res.json()).filter((g) => g.tarjeta === marcador)).toHaveLength(0)

  // Y al volver a la lista sigue la pantalla principal, sin nada nuevo de mi parte.
  await page.getByRole('button', { name: 'Volver' }).click()
  await expect(page.getByRole('heading', { name: /Mis Gastos/ })).toBeVisible()
})

test('flujo 3: editar un gasto, recargar para comprobar que quedo guardado y eliminarlo', async ({ page, request }) => {
  const descripcion = unico('edicion')
  descripciones.push(descripcion)

  // Preparacion por pantalla: un gasto propio de $150 en Comida.
  await abrirMisGastos(page)
  await agregarGasto(page, { descripcion, monto: 150, categoria: 'Comida', medioPago: 'Efectivo' })
  await expect(filaDe(page, descripcion)).toContainText('$150')

  // Editar: el boton de MI fila abre el formulario con mis datos cargados.
  await filaDe(page, descripcion).getByRole('button', { name: 'Editar' }).click()
  await expect(page.getByRole('heading', { name: 'Editar gasto' })).toBeVisible()
  await expect(page.getByLabel('Descripción', { exact: true })).toHaveValue(descripcion)

  await page.getByLabel('Monto', { exact: true }).fill('275.5')
  await page.getByLabel('Categoría', { exact: true }).selectOption('Transporte')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()

  // El cambio se ve en la lista...
  const fila = filaDe(page, descripcion)
  await expect(fila).toContainText('$275.5')
  await expect(fila).toContainText('Transporte')
  await expect(fila).not.toContainText('$150')

  // ...y sobrevive a recargar la pagina: viene de la base, no de la memoria del navegador.
  await page.reload()
  await expect(filaDe(page, descripcion)).toContainText('$275.5')
  await expect(filaDe(page, descripcion)).toContainText('Transporte')

  // Eliminar y comprobar la limpieza.
  await filaDe(page, descripcion).getByRole('button', { name: 'Eliminar' }).click()
  await expect(filaDe(page, descripcion)).toHaveCount(0)
  expect(await existeEnLaBase(request, descripcion)).toBe(false)
})
