// Tests unitarios de lib/api.js. Sin red real: el cliente recibe un doble de fetch (vi.fn()).
import { describe, it, expect, vi } from 'vitest'
import { mensajeDeError, guardarGastoEnApi, eliminarGastoEnApi } from './api'

describe('mensajeDeError', () => {
  it.each([
    { caso: 'usa el mensaje que manda el backend', data: { error: 'El monto debe ser un número mayor a 0' }, esperado: 'El monto debe ser un número mayor a 0' },
    { caso: 'usa el mensaje por defecto si el backend no manda error', data: {}, esperado: 'No se pudo guardar el gasto' },
    { caso: 'usa el mensaje por defecto si el error viene vacio', data: { error: '' }, esperado: 'No se pudo guardar el gasto' },
  ])('$caso', ({ data, esperado }) => {
    // Arrange: la respuesta de error del backend (data) y el mensaje por defecto
    const mensajePorDefecto = 'No se pudo guardar el gasto'

    // Act
    const mensaje = mensajeDeError(data, mensajePorDefecto)

    // Assert
    expect(mensaje).toBe(esperado)
  })
})

// Respuesta falsa de fetch: ok / status y un json() que devuelve `data`.
// json es un vi.fn() para poder comprobar si el cliente lo llamo o no.
function respuestaFalsa(ok, data) {
  return { ok, json: vi.fn().mockResolvedValue(data) }
}

const DATOS_GASTO = { descripcion: 'Supermercado', monto: 1500, categoria: 'Comida', fecha: '2026-06-15', medioPago: 'Efectivo' }

describe('guardarGastoEnApi (con fetch mockeado)', () => {
  it.each([
    { caso: 'sin gastoEditando crea con POST /api/gastos', gastoEditando: null, url: '/api/gastos', metodo: 'POST' },
    { caso: 'con gastoEditando actualiza con PUT /api/gastos/:id', gastoEditando: { id: 7 }, url: '/api/gastos/7', metodo: 'PUT' },
  ])('$caso', async ({ gastoEditando, url, metodo }) => {
    // Arrange: el doble de fetch responde OK con el gasto guardado (stub) y queda registrando las llamadas (mock)
    const guardado = { id: 7, ...DATOS_GASTO }
    const fetchFalso = vi.fn().mockResolvedValue(respuestaFalsa(true, guardado))

    // Act
    const resultado = await guardarGastoEnApi(DATOS_GASTO, gastoEditando, fetchFalso)

    // Assert: se llamo UNA vez, con la url/metodo/cabecera/cuerpo correctos, y devolvio lo que respondio el backend
    expect(fetchFalso).toHaveBeenCalledTimes(1)
    expect(fetchFalso).toHaveBeenCalledWith(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DATOS_GASTO),
    })
    expect(resultado).toEqual(guardado)
  })

  it.each([
    { caso: 'lanza el mensaje que manda el backend', data: { error: 'El monto debe ser un número mayor a 0' }, esperado: 'El monto debe ser un número mayor a 0' },
    { caso: 'lanza el mensaje por defecto si el backend no manda error', data: {}, esperado: 'No se pudo guardar el gasto' },
  ])('si el backend responde con error $caso', async ({ data, esperado }) => {
    // Arrange: el doble de fetch simula una respuesta 400 del backend
    const fetchFalso = vi.fn().mockResolvedValue(respuestaFalsa(false, data))

    // Act + Assert
    await expect(guardarGastoEnApi(DATOS_GASTO, null, fetchFalso)).rejects.toThrow(esperado)
    expect(fetchFalso).toHaveBeenCalledTimes(1)
  })

  it('si falla la red propaga el error de fetch', async () => {
    // Arrange: el doble de fetch rechaza (sin conexion, backend caido)
    const fetchFalso = vi.fn().mockRejectedValue(new Error('Failed to fetch'))

    // Act + Assert
    await expect(guardarGastoEnApi(DATOS_GASTO, null, fetchFalso)).rejects.toThrow('Failed to fetch')
  })
})

describe('eliminarGastoEnApi (con fetch mockeado)', () => {
  it('pide DELETE /api/gastos/:id y no lee el cuerpo si salio bien', async () => {
    // Arrange
    const respuesta = respuestaFalsa(true, {})
    const fetchFalso = vi.fn().mockResolvedValue(respuesta)

    // Act
    await eliminarGastoEnApi(3, fetchFalso)

    // Assert
    expect(fetchFalso).toHaveBeenCalledTimes(1)
    expect(fetchFalso).toHaveBeenCalledWith('/api/gastos/3', { method: 'DELETE' })
    expect(respuesta.json).not.toHaveBeenCalled()
  })

  it.each([
    { caso: 'el mensaje del backend', data: { error: 'Gasto no encontrado' }, esperado: 'Gasto no encontrado' },
    { caso: 'el mensaje por defecto', data: {}, esperado: 'No se pudo eliminar el gasto' },
  ])('si el backend responde con error lanza $caso', async ({ data, esperado }) => {
    // Arrange
    const fetchFalso = vi.fn().mockResolvedValue(respuestaFalsa(false, data))

    // Act + Assert
    await expect(eliminarGastoEnApi(99, fetchFalso)).rejects.toThrow(esperado)
    expect(fetchFalso).toHaveBeenCalledWith('/api/gastos/99', { method: 'DELETE' })
  })
})
