// Tests de las operaciones sobre gastos con la base de datos REEMPLAZADA POR UN MOCK.
// crearGasto / actualizarGasto / eliminarGasto reciben `db` por parametro, asi que aca
// les pasamos un objeto falso con un metodo query() espiado por vi.fn():
//   - nunca se conecta a PostgreSQL;
//   - ademas de devolver datos (stub), registra cuantas veces se lo llamo y con que
//     argumentos, y los tests verifican esas llamadas (eso es lo que lo hace un mock).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { crearGasto, actualizarGasto, eliminarGasto } from '../index.js'

let db

beforeEach(() => {
  // "Hoy" fijo (15/06/2026) para que la validacion de fechas sea determinista
  vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0))
  // La base de datos falsa: un objeto con query() espiado
  db = { query: vi.fn() }
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const datosValidos = (cambios = {}) => ({
  descripcion: 'Supermercado',
  monto: 1500,
  categoria: 'Comida',
  fecha: '2026-06-15',
  medioPago: 'Efectivo',
  ...cambios,
})

describe('crearGasto', () => {
  it('inserta el gasto una sola vez, con los valores en el orden correcto, y responde 201', async () => {
    // Arrange: la base falsa "devuelve" la fila que insertaria
    const filaGuardada = { id: 1, descripcion: 'Supermercado', monto: '1500' }
    db.query.mockResolvedValue({ rows: [filaGuardada] })

    // Act
    const respuesta = await crearGasto(db, datosValidos())

    // Assert: comportamiento visible...
    expect(respuesta).toEqual({ status: 201, body: filaGuardada })
    // ...e interaccion con la dependencia (esto es lo que hace de esto un MOCK)
    expect(db.query).toHaveBeenCalledTimes(1)
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO gastos'),
      ['Supermercado', 1500, 'Comida', '2026-06-15', 'Efectivo', null, null]
    )
  })

  it('con datos invalidos responde 400 y NO llega a tocar la base de datos', async () => {
    // Arrange
    const gastoConMontoCero = datosValidos({ monto: 0 })

    // Act
    const respuesta = await crearGasto(db, gastoConMontoCero)

    // Assert
    expect(respuesta).toEqual({ status: 400, body: { error: 'El monto debe ser un número mayor a 0' } })
    expect(db.query).not.toHaveBeenCalled()
  })

  it('si la base de datos falla responde 500 con un mensaje generico (error de infraestructura)', async () => {
    // Arrange: la base falsa simula una caida y silenciamos el console.error esperado
    db.query.mockRejectedValue(new Error('connection refused'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // Act
    const respuesta = await crearGasto(db, datosValidos())

    // Assert: el cliente no ve el detalle interno del error
    expect(respuesta).toEqual({ status: 500, body: { error: 'Error al crear el gasto' } })
    expect(db.query).toHaveBeenCalledTimes(1)
  })
})

describe('actualizarGasto', () => {
  it('si el gasto no existe responde 404 y no ejecuta ningun UPDATE', async () => {
    // Arrange: la base falsa responde "no hay filas" a la busqueda
    db.query.mockResolvedValue({ rows: [] })

    // Act
    const respuesta = await actualizarGasto(db, 999, { monto: 100 })

    // Assert: solo se hizo la consulta de busqueda (1 llamada), nada de UPDATE
    expect(respuesta).toEqual({ status: 404, body: { error: 'Gasto no encontrado' } })
    expect(db.query).toHaveBeenCalledTimes(1)
    expect(db.query).toHaveBeenCalledWith('SELECT * FROM gastos WHERE id = $1', [999])
  })

  it('actualiza solo los campos enviados y conserva el resto de los valores actuales', async () => {
    // Arrange: 1ra llamada -> el gasto actual; 2da llamada -> el gasto ya actualizado
    const actual = {
      id: 7, descripcion: 'Cena', monto: '800', categoria: 'Comida',
      fecha: '2026-03-10', medio_pago: 'Tarjeta', tarjeta: 'Visa', tipo: 'Crédito',
    }
    const actualizado = { ...actual, monto: '2000' }
    db.query
      .mockResolvedValueOnce({ rows: [actual] })
      .mockResolvedValueOnce({ rows: [actualizado] })

    // Act: se cambia SOLO el monto
    const respuesta = await actualizarGasto(db, 7, { monto: 2000 })

    // Assert: el UPDATE (2da llamada) lleva el monto nuevo y todo lo demas igual
    expect(respuesta).toEqual({ status: 200, body: actualizado })
    expect(db.query).toHaveBeenCalledTimes(2)
    expect(db.query).toHaveBeenLastCalledWith(
      expect.stringContaining('UPDATE gastos SET'),
      ['Cena', 2000, 'Comida', '2026-03-10', 'Tarjeta', 'Visa', 'Crédito', 7]
    )
  })
})

describe('eliminarGasto', () => {
  it('borra el gasto indicado y responde 204 sin cuerpo', async () => {
    // Arrange: la base falsa informa que borro 1 fila
    db.query.mockResolvedValue({ rowCount: 1 })

    // Act
    const respuesta = await eliminarGasto(db, 3)

    // Assert
    expect(respuesta).toEqual({ status: 204 })
    expect(db.query).toHaveBeenCalledTimes(1)
    expect(db.query).toHaveBeenCalledWith('DELETE FROM gastos WHERE id = $1', [3])
  })

  it('si no se borro ninguna fila responde 404', async () => {
    // Arrange: la base falsa informa que no borro nada
    db.query.mockResolvedValue({ rowCount: 0 })

    // Act
    const respuesta = await eliminarGasto(db, 999)

    // Assert
    expect(respuesta).toEqual({ status: 404, body: { error: 'Gasto no encontrado' } })
  })
})
