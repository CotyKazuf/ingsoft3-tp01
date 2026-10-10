// Tests unitarios de las reglas de validacion de un gasto (validarCamposGasto).
// Son funciones puras: no tocan la base ni levantan Express.
// Cada test sigue el patron AAA: Arrange (preparar), Act (ejecutar), Assert (verificar).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { validarCamposGasto } from '../index.js'

// "Hoy" queda fijo para que los tests den lo mismo en cualquier fecha y zona horaria.
const HOY = '2026-06-15'

beforeEach(() => {
  // 15/06/2026 a las 12:00 hora local
  vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

// Un gasto completo y valido. Cada test cambia solo el campo que quiere probar.
const gastoValido = (cambios = {}) => ({
  descripcion: 'Supermercado',
  monto: 1500,
  categoria: 'Comida',
  fecha: HOY,
  medioPago: 'Efectivo',
  ...cambios,
})

describe('gasto completo', () => {
  it('no devuelve error para un gasto con tarjeta de credito totalmente valido', () => {
    // Arrange
    const gasto = gastoValido({ medioPago: 'Tarjeta', tipo: 'Crédito' })

    // Act
    const error = validarCamposGasto(gasto)

    // Assert
    expect(error).toBeNull()
  })
})

describe('regla: el monto debe ser un numero mayor a 0', () => {
  it.each([
    { caso: 'cero', monto: 0 },
    { caso: 'negativo', monto: -5 },
    { caso: 'texto con forma de numero', monto: '100' },
    { caso: 'null', monto: null },
    { caso: 'ausente', monto: undefined },
  ])('rechaza el monto $caso', ({ monto }) => {
    // Arrange
    const gasto = gastoValido({ monto })

    // Act
    const error = validarCamposGasto(gasto)

    // Assert
    expect(error).toBe('El monto debe ser un número mayor a 0')
  })

  it('acepta el monto positivo mas chico posible (0.01)', () => {
    // Arrange
    const gasto = gastoValido({ monto: 0.01 })

    // Act
    const error = validarCamposGasto(gasto)

    // Assert
    expect(error).toBeNull()
  })
})

describe('regla: la descripcion es obligatoria', () => {
  it.each([
    { caso: 'vacia', descripcion: '' },
    { caso: 'solo espacios', descripcion: '   ' },
    { caso: 'null', descripcion: null },
    { caso: 'ausente', descripcion: undefined },
  ])('rechaza la descripcion $caso', ({ descripcion }) => {
    // Arrange
    const gasto = gastoValido({ descripcion })

    // Act
    const error = validarCamposGasto(gasto)

    // Assert
    expect(error).toBe('La descripción es obligatoria')
  })
})

describe('regla: la fecha debe ser valida, no futura y del anio actual', () => {
  it('rechaza una fecha futura y el mensaje dice por que', () => {
    // Arrange
    const manana = '2026-06-16'
    const gasto = gastoValido({ fecha: manana })

    // Act
    const error = validarCamposGasto(gasto)

    // Assert
    expect(error).toBe('La fecha no puede ser futura')
  })

  it('acepta una fecha igual a hoy (borde: hoy si, manana no)', () => {
    // Arrange
    const gasto = gastoValido({ fecha: HOY })

    // Act
    const error = validarCamposGasto(gasto)

    // Assert
    expect(error).toBeNull()
  })

  it('rechaza una fecha de otro anio y el mensaje indica el anio permitido', () => {
    // Arrange
    const ultimoDiaDelAnioPasado = '2025-12-31'
    const gasto = gastoValido({ fecha: ultimoDiaDelAnioPasado })

    // Act
    const error = validarCamposGasto(gasto)

    // Assert
    expect(error).toBe('La fecha debe ser del año 2026')
  })

  it.each([
    { caso: 'texto que no es fecha', fecha: 'no-es-fecha' },
    { caso: 'vacia', fecha: '' },
    { caso: 'ausente', fecha: undefined },
  ])('rechaza la fecha $caso', ({ fecha }) => {
    // Arrange
    const gasto = gastoValido({ fecha })

    // Act
    const error = validarCamposGasto(gasto)

    // Assert
    expect(error).toBe('Fecha inválida')
  })
})

describe('regla: categoria y medio de pago deben estar en las listas permitidas', () => {
  it('rechaza una categoria que no existe', () => {
    // Arrange
    const gasto = gastoValido({ categoria: 'Lujos' })

    // Act
    const error = validarCamposGasto(gasto)

    // Assert
    expect(error).toBe('Categoría inválida')
  })

  it('rechaza un medio de pago que no existe', () => {
    // Arrange
    const gasto = gastoValido({ medioPago: 'Cheque' })

    // Act
    const error = validarCamposGasto(gasto)

    // Assert
    expect(error).toBe('Medio de pago inválido')
  })
})

describe('regla: el tipo de tarjeta es opcional pero, si viene, debe ser Debito o Credito', () => {
  it('rechaza un tipo de tarjeta que no existe', () => {
    // Arrange
    const gasto = gastoValido({ medioPago: 'Tarjeta', tipo: 'Prepago' })

    // Act
    const error = validarCamposGasto(gasto)

    // Assert
    expect(error).toBe('Tipo de tarjeta inválido')
  })

  it('acepta un gasto sin tipo de tarjeta (borde: campo opcional)', () => {
    // Arrange
    const gasto = gastoValido({ medioPago: 'Efectivo', tipo: undefined })

    // Act
    const error = validarCamposGasto(gasto)

    // Assert
    expect(error).toBeNull()
  })
})

describe('regla: la actualizacion (PUT) es parcial', () => {
  it('acepta una actualizacion sin ningun campo (se conserva todo lo actual)', () => {
    // Arrange
    const cambios = {}

    // Act
    const error = validarCamposGasto(cambios, { parcial: true })

    // Assert
    expect(error).toBeNull()
  })

  it('valida con las mismas reglas un campo que si viene en la actualizacion', () => {
    // Arrange
    const cambios = { monto: 0 }

    // Act
    const error = validarCamposGasto(cambios, { parcial: true })

    // Assert
    expect(error).toBe('El monto debe ser un número mayor a 0')
  })
})
