// Tests unitarios de resumirGastos (backend/resumen.js).
// Es una funcion pura: recibe una lista de gastos y devuelve un resumen,
// asi que no hace falta base de datos, Express ni mocks.
// Cada test sigue el patron AAA: Arrange (preparar), Act (ejecutar), Assert (verificar).
import { describe, it, expect } from 'vitest'
import { resumirGastos } from '../resumen.js'

// Los gastos tienen la forma que devuelve GET /api/gastos: el monto llega como TEXTO
// (PostgreSQL NUMERIC) y la fecha como "YYYY-MM-DD".
const gasto = (cambios = {}) => ({
  descripcion: 'Gasto de prueba',
  monto: '100',
  categoria: 'Comida',
  fecha: '2026-05-10',
  ...cambios,
})

// Tres gastos en dos meses y dos categorias. Total: 4300.50.
const supermercado = gasto({ descripcion: 'Supermercado', monto: '1500.50', categoria: 'Comida', fecha: '2026-05-10' })
const cine = gasto({ descripcion: 'Cine', monto: '800', categoria: 'Ocio', fecha: '2026-05-20' })
const pizza = gasto({ descripcion: 'Pizza', monto: '2000', categoria: 'Comida', fecha: '2026-06-02' })
const gastos = [supermercado, cine, pizza]

const VACIO = { cantidad: 0, total: 0, promedio: 0, mayor: null, categoriaTop: null }

describe('resumirGastos sin filtrar por mes', () => {
  it('calcula cantidad, total, promedio, gasto mayor y categoria top', () => {
    // Act
    const resumen = resumirGastos(gastos)

    // Assert
    expect(resumen).toEqual({
      cantidad: 3,
      total: 4300.5,
      promedio: 1433.5,
      mayor: pizza,
      categoriaTop: 'Comida', // 1500.50 + 2000 = 3500.50 contra 800 de Ocio
    })
  })

  it('devuelve el resumen vacio cuando la lista no tiene gastos', () => {
    expect(resumirGastos([])).toEqual(VACIO)
  })

  it('suma los montos como numeros aunque lleguen como texto', () => {
    // Arrange: si se concatenaran como texto darian "1020" en lugar de 30
    const lista = [gasto({ monto: '10' }), gasto({ monto: '20' })]

    // Act
    const resumen = resumirGastos(lista)

    // Assert
    expect(resumen.total).toBe(30)
    expect(resumen.promedio).toBe(15)
  })

  it('redondea total y promedio a 2 decimales', () => {
    // Arrange: 0.1 + 0.2 en punto flotante da 0.30000000000000004
    const lista = [gasto({ monto: '0.1' }), gasto({ monto: '0.2' })]

    // Act
    const resumen = resumirGastos(lista)

    // Assert
    expect(resumen.total).toBe(0.3)
    expect(resumen.promedio).toBe(0.15)
  })

  it('elige como categoria top la que mas suma, aunque aparezca despues', () => {
    // Arrange: Ocio supera a Transporte, que fue la primera categoria vista
    const lista = [
      gasto({ monto: '100', categoria: 'Transporte' }),
      gasto({ monto: '500', categoria: 'Ocio' }),
    ]

    // Act
    const resumen = resumirGastos(lista)

    // Assert
    expect(resumen.categoriaTop).toBe('Ocio')
  })

  it('ante un empate de categorias o de monto conserva el primero', () => {
    // Arrange: dos gastos iguales en monto, de categorias distintas
    const primero = gasto({ descripcion: 'Primero', monto: '300', categoria: 'Comida' })
    const segundo = gasto({ descripcion: 'Segundo', monto: '300', categoria: 'Ocio' })

    // Act
    const resumen = resumirGastos([primero, segundo])

    // Assert
    expect(resumen.mayor).toBe(primero)
    expect(resumen.categoriaTop).toBe('Comida')
  })
})

describe('resumirGastos filtrando por mes', () => {
  it('resume solo los gastos del mes pedido', () => {
    // Act
    const resumen = resumirGastos(gastos, '05')

    // Assert
    expect(resumen).toEqual({
      cantidad: 2,
      total: 2300.5,
      promedio: 1150.25,
      mayor: supermercado,
      categoriaTop: 'Comida',
    })
  })

  it.each([
    ['05', 2],
    ['06', 1],
  ])('el mes %s tiene %i gasto(s)', (mes, cantidadEsperada) => {
    expect(resumirGastos(gastos, mes).cantidad).toBe(cantidadEsperada)
  })

  it('devuelve el resumen vacio si el mes no tiene gastos', () => {
    expect(resumirGastos(gastos, '07')).toEqual(VACIO)
  })

  it.each(['01', '09', '10', '12'])('acepta el mes %s en los limites del formato', (mes) => {
    expect(() => resumirGastos([], mes)).not.toThrow()
  })
})

describe('resumirGastos con datos invalidos', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['un texto', 'gastos'],
    ['un numero', 42],
    ['un objeto', {}],
  ])('lanza error si los gastos son %s y no una lista', (_nombre, entrada) => {
    expect(() => resumirGastos(entrada)).toThrow('Los gastos deben ser una lista')
  })

  it.each([
    ['13', '13'],
    ['00', '00'],
    ['sin cero inicial', '5'],
    ['con letras', 'mayo'],
    ['vacio', ''],
    ['null', null],
    ['un numero', 5],
  ])('lanza error si el mes es invalido (%s)', (_nombre, mes) => {
    expect(() => resumirGastos(gastos, mes)).toThrow('El mes debe ser un texto entre 01 y 12')
  })
})
