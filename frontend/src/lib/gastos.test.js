// Tests unitarios de la logica pura de lib/gastos.js.
// Sin DOM, sin React y sin red: se llama a las funciones con datos y se verifica el resultado.
// Cada test sigue el patron AAA: Arrange (preparar), Act (ejecutar), Assert (verificar).
import { describe, it, expect } from 'vitest'
import {
  calcularTotal,
  totalesPorCategoria,
  filtrarGastos,
  totalesPorMes,
  formatearFecha,
  construirDatosGasto,
} from './gastos'

// Gastos de ejemplo. Los montos vienen como texto o numero porque PostgreSQL
// devuelve NUMERIC como texto ("1000.50").
const gastos = [
  { id: 1, categoria: 'Comida', fecha: '2026-01-15', monto: '1000.50' },
  { id: 2, categoria: 'Transporte', fecha: '2026-01-20', monto: 300 },
  { id: 3, categoria: 'Comida', fecha: '2026-02-03', monto: '200' },
  { id: 4, categoria: 'Salud', fecha: '2026-02-10', monto: '50.25' },
]

describe('calcularTotal', () => {
  it('suma los montos aunque algunos lleguen como texto', () => {
    // Arrange: gastos con montos '1000.50', 300, '200' y '50.25'

    // Act
    const total = calcularTotal(gastos)

    // Assert: si se concatenaran como texto, el resultado seria una cadena y no 1550.75
    expect(total).toBe(1550.75)
  })

  it('devuelve 0 cuando todavia no hay gastos (borde: lista vacia)', () => {
    // Arrange
    const sinGastos = []

    // Act
    const total = calcularTotal(sinGastos)

    // Assert
    expect(total).toBe(0)
  })
})

describe('filtrarGastos', () => {
  it.each([
    { caso: 'sin filtros devuelve todos', filtros: { categoria: '', mes: '' }, ids: [1, 2, 3, 4] },
    { caso: 'solo por categoria', filtros: { categoria: 'Comida', mes: '' }, ids: [1, 3] },
    { caso: 'solo por mes', filtros: { categoria: '', mes: '02' }, ids: [3, 4] },
    { caso: 'por categoria y mes a la vez', filtros: { categoria: 'Comida', mes: '01' }, ids: [1] },
    { caso: 'sin coincidencias devuelve lista vacia', filtros: { categoria: 'Salud', mes: '01' }, ids: [] },
  ])('$caso', ({ filtros, ids }) => {
    // Arrange: la lista de gastos y los filtros de la fila

    // Act
    const resultado = filtrarGastos(gastos, filtros)

    // Assert
    expect(resultado.map((g) => g.id)).toEqual(ids)
  })
})

describe('totalesPorCategoria', () => {
  it('suma por categoria, en el orden de la lista, y omite las categorias sin gastos', () => {
    // Arrange: hay gastos de Comida, Transporte y Salud; ninguno de Vivienda, Entretenimiento ni Otros

    // Act
    const totales = totalesPorCategoria(gastos)

    // Assert
    expect(totales).toEqual([
      { categoria: 'Comida', total: 1200.5 },
      { categoria: 'Transporte', total: 300 },
      { categoria: 'Salud', total: 50.25 },
    ])
  })
})

describe('totalesPorMes', () => {
  it('devuelve los 12 meses del anio con la suma de cada uno (los meses sin gastos dan 0)', () => {
    // Arrange: gastos solo de enero y febrero

    // Act
    const totales = totalesPorMes(gastos, 2026)

    // Assert
    expect(totales).toHaveLength(12)
    expect(totales[0]).toEqual({ nombre: 'Enero', total: 1300.5 })
    expect(totales[1]).toEqual({ nombre: 'Febrero', total: 250.25 })
    expect(totales.slice(2).every((mes) => mes.total === 0)).toBe(true)
  })

  it('ignora los gastos de otros anios', () => {
    // Arrange: un gasto de enero de 2025 que no tiene que contarse en 2026
    const conOtroAnio = [...gastos, { id: 5, categoria: 'Otros', fecha: '2025-01-10', monto: '999' }]

    // Act
    const totales = totalesPorMes(conOtroAnio, 2026)

    // Assert: enero sigue valiendo 1300.5 (no 2299.5)
    expect(totales[0].total).toBe(1300.5)
  })
})

describe('formatearFecha', () => {
  it('convierte la fecha ISO al formato dia/mes/anio', () => {
    // Arrange
    const fechaISO = '2026-03-05'

    // Act
    const texto = formatearFecha(fechaISO)

    // Assert
    expect(texto).toBe('05/03/2026')
  })
})

describe('construirDatosGasto', () => {
  const formulario = {
    descripcion: 'Super',
    monto: '1500.5',
    categoria: 'Comida',
    fecha: '2026-06-15',
    tarjeta: 'Visa',
    tipo: 'Crédito',
  }

  it('convierte el monto del formulario (texto) en numero', () => {
    // Arrange
    const datos = { ...formulario, medioPago: 'Efectivo' }

    // Act
    const cuerpo = construirDatosGasto(datos)

    // Assert
    expect(cuerpo.monto).toBe(1500.5)
  })

  it.each([
    { medioPago: 'Efectivo', tarjeta: null, tipo: null },
    { medioPago: 'Transferencia', tarjeta: null, tipo: null },
    { medioPago: 'Tarjeta', tarjeta: 'Visa', tipo: 'Crédito' },
  ])('con medio de pago $medioPago envia tarjeta=$tarjeta y tipo=$tipo', ({ medioPago, tarjeta, tipo }) => {
    // Arrange: el formulario conserva "Visa" y "Crédito" aunque el usuario haya cambiado el medio de pago
    const datos = { ...formulario, medioPago }

    // Act
    const cuerpo = construirDatosGasto(datos)

    // Assert: solo con "Tarjeta" viajan la tarjeta y su tipo
    expect(cuerpo.tarjeta).toBe(tarjeta)
    expect(cuerpo.tipo).toBe(tipo)
  })
})
