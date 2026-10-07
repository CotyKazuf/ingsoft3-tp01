import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Los tests viven al lado del codigo que prueban, en src/ (por ejemplo src/lib/)
    include: ['src/**/*.test.js'],
    // Solo logica pura: Node, sin navegador simulado (no hay jsdom ni DOM)
    environment: 'node',
  },
})
