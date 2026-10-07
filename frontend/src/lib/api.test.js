// Tests unitarios de lib/api.js (sin red: solo la parte pura).
import { describe, it, expect } from 'vitest'
import { mensajeDeError } from './api'

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
