import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Solo se ejecutan los archivos de la carpeta tests/
    include: ['tests/**/*.test.js'],
    // El backend es Node puro: no hace falta simular un navegador
    environment: 'node',
  },
})
