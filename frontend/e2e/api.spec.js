// Pruebas de INTEGRACION de la API de Mis Gastos (TP7).
// Corren con la fixture "request" de Playwright: pedidos HTTP directos, SIN navegador.
// Van contra una API REAL y su PostgreSQL REAL (en el pipeline: la API de QA desplegada).
// Nada esta simulado: cada test escribe y lee en la base de verdad.
//
// Direccion de la API: variable API_BASE_URL (ej. https://misgastos-api-qa.onrender.com).
// En tu maquina, si no la definis, usa http://localhost:3000 (docker compose up -d db backend).
import { test, expect } from '@playwright/test'

const API = process.env.API_BASE_URL || 'http://localhost:3000'

// En el pipeline (CI=true) NO se admite el fallback a localhost: si falta la variable,
// una corrida "verde" podria estar probando cualquier cosa menos QA.
if (process.env.CI && !process.env.API_BASE_URL) {
  throw new Error('Falta API_BASE_URL: el pipeline tiene que apuntar a la API de QA.')
}

// Este valor pisa el baseURL del proyecto en playwright.config.js (para que valga el fallback local).
test.use({ baseURL: API })

// ---------------------------------------------------------------------------------------
// Ayudas
// ---------------------------------------------------------------------------------------

// Nombre unico por test y por corrida: asi mis aserciones miran SOLO mis datos,
// aunque la base de QA tenga gastos de otras corridas o de uso manual.
const unico = (prefijo) => `api-${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// Fecha valida para la regla del backend ("no futura" y "del año actual"): 1 de enero de este año.
const FECHA = `${new Date().getFullYear()}-01-01`

// Cuerpo valido de POST /api/gastos (los campos son los REALES de Mis Gastos).
const gastoValido = (descripcion, extra = {}) => ({
  descripcion,
  monto: 100,
  categoria: 'Comida',
  fecha: FECHA,
  medioPago: 'Efectivo',
  ...extra,
})

// Ids que este test creo y todavia no borro. Si un test falla a la mitad,
// afterEach los borra igual para no ensuciar la base (red de seguridad).
let pendientes = []

test.beforeEach(() => {
  pendientes = []
})

test.afterEach(async ({ request }) => {
  for (const id of pendientes) {
    await request.delete(`/api/gastos/${id}`, { timeout: 30_000 }) // 404 si ya no esta: no importa
  }
})

// Render Free duerme los servicios: el primer pedido puede tardar ~50 s (y la base tambien).
// Se "despierta" API + base una sola vez, con reintentos, antes del primer test.
test.beforeAll(async ({ playwright }) => {
  test.setTimeout(240_000)
  const ctx = await playwright.request.newContext({ baseURL: API })
  try {
    await expect(async () => {
      const res = await ctx.get('/api/gastos', { timeout: 30_000 }) // toca la base de datos
      expect(res.status()).toBe(200)
    }).toPass({ timeout: 200_000, intervals: [2_000, 5_000, 10_000] })
  } finally {
    await ctx.dispose()
  }
})

async function listar(request) {
  const res = await request.get('/api/gastos', { timeout: 30_000 })
  expect(res.status()).toBe(200)
  return res.json()
}

// ---------------------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------------------

test('alta, lectura y borrado de un gasto (ciclo completo contra la base real)', async ({ request }) => {
  const descripcion = unico('alta')

  // 1) ALTA: la API acepta el gasto y responde 201 con la fila creada.
  const alta = await request.post('/api/gastos', { data: gastoValido(descripcion, { monto: 1234.5 }) })
  expect(alta.status()).toBe(201)
  const creado = await alta.json()
  pendientes.push(creado.id)
  expect(creado.id).toEqual(expect.any(Number))
  expect(creado.descripcion).toBe(descripcion)

  // 2) LECTURA: el gasto esta en la base y es EXACTAMENTE el que mandé (viene de un GET aparte).
  const tras = await listar(request)
  const propios = tras.filter((g) => g.descripcion === descripcion)
  expect(propios).toHaveLength(1)
  expect(propios[0]).toMatchObject({
    id: creado.id,
    categoria: 'Comida',
    fecha: FECHA,
    medio_pago: 'Efectivo',
  })
  expect(Number(propios[0].monto)).toBe(1234.5) // NUMERIC de Postgres llega como texto

  // 3) BORRADO: 204 sin cuerpo.
  const baja = await request.delete(`/api/gastos/${creado.id}`)
  expect(baja.status()).toBe(204)
  pendientes = pendientes.filter((id) => id !== creado.id)

  // 4) LIMPIEZA VERIFICADA: un GET nuevo ya no lo encuentra.
  const despues = await listar(request)
  expect(despues.filter((g) => g.descripcion === descripcion)).toHaveLength(0)
  expect(despues.some((g) => g.id === creado.id)).toBe(false)
})

test('alta invalida: sin descripcion la API responde 400 y no guarda nada', async ({ request }) => {
  // Con la descripcion vacia no hay nombre para reconocer la fila, asi que uso un marcador unico
  // en "tarjeta" (la API guarda ese campo tal cual): si se hubiera creado algo, lo encuentro por ahi.
  const marcador = unico('invalido')
  const cuerpo = gastoValido('', { medioPago: 'Tarjeta', tarjeta: marcador, tipo: 'Débito' })

  const res = await request.post('/api/gastos', { data: cuerpo })
  const texto = await res.text()
  // Si por error la API lo hubiera aceptado, anoto el id para que afterEach lo borre.
  if (res.status() === 201) pendientes.push(JSON.parse(texto).id)

  expect(res.status()).toBe(400)
  expect(JSON.parse(texto)).toEqual({ error: 'La descripción es obligatoria' })

  // Verificacion en la base real: ningun gasto quedo con mi marcador.
  const lista = await listar(request)
  expect(lista.filter((g) => g.tarjeta === marcador)).toHaveLength(0)
})

test('actualizacion: PUT parcial se guarda, una edicion invalida se rechaza y no pisa lo guardado', async ({ request }) => {
  const descripcion = unico('edicion')

  // Preparacion: un gasto propio.
  const alta = await request.post('/api/gastos', { data: gastoValido(descripcion, { monto: 100 }) })
  expect(alta.status()).toBe(201)
  const { id } = await alta.json()
  pendientes.push(id)

  // 1) Edicion VALIDA y PARCIAL: solo mando monto y categoria.
  const put = await request.put(`/api/gastos/${id}`, { data: { monto: 250, categoria: 'Transporte' } })
  expect(put.status()).toBe(200)

  // 2) Lo guardado en Postgres cambio, y lo que NO mande quedo igual.
  const leerPropio = async () => (await listar(request)).filter((g) => g.id === id)
  let [guardado] = await leerPropio()
  expect(Number(guardado.monto)).toBe(250)
  expect(guardado.categoria).toBe('Transporte')
  expect(guardado.descripcion).toBe(descripcion)
  expect(guardado.fecha).toBe(FECHA)
  expect(guardado.medio_pago).toBe('Efectivo')

  // 3) Regla de validacion tambien al editar: monto negativo => 400 y la fila NO cambia.
  const malo = await request.put(`/api/gastos/${id}`, { data: { monto: -5 } })
  expect(malo.status()).toBe(400)
  expect((await malo.json()).error).toBe('El monto debe ser un número mayor a 0')
  ;[guardado] = await leerPropio()
  expect(Number(guardado.monto)).toBe(250)

  // 4) Borrado y limpieza verificada.
  const baja = await request.delete(`/api/gastos/${id}`)
  expect(baja.status()).toBe(204)
  pendientes = pendientes.filter((p) => p !== id)
  expect(await leerPropio()).toHaveLength(0)
})
