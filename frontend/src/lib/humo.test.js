// TEST TEMPORAL (Fase 5): solo comprueba que el runner funciona y que corre sin DOM.
// En la Fase 6 se reemplaza por los tests de la logica real (src/lib/*.test.js).
import { describe, it, expect } from 'vitest'

describe('infraestructura de tests del frontend', () => {
  it('corre en Node puro, sin navegador simulado (no existe window ni document)', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
  })
})
