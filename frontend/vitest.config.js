import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Los tests viven al lado del codigo que prueban, en src/ (por ejemplo src/lib/)
    include: ['src/**/*.test.js'],
    // Solo logica pura: Node, sin navegador simulado (no hay jsdom ni DOM)
    environment: 'node',

    // COVERAGE (se mide con: npm run test:coverage). Si no llega al umbral, el comando falla.
    coverage: {
      // v8 = el cobertor que viene dentro de Node (no instrumenta el codigo, mide al ejecutar)
      provider: 'v8',
      // QUE SE MIDE: la capa de logica del frontend, src/lib/ (calculos, filtros, armado de
      // datos y cliente de la API). Es donde esta TODA la logica no visual, y lo que se puede
      // probar sin DOM. Un archivo nuevo en src/lib/ entra solo en la medicion.
      include: ['src/lib/**/*.js'],
      // QUE NO SE MIDE: los tests, que viven dentro de src/lib/ al lado del codigo.
      // Tampoco entran los componentes .jsx (App, pages/, components/) ni main.jsx (arranque):
      // son pantallas; probarlas exige un navegador/DOM, y eso lo cubren las pruebas e2e (TP7).
      exclude: ['**/*.test.js'],
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      // Genera el reporte tambien cuando un TEST falla (por defecto no lo hace). Sirve para
      // diagnosticar desde el artifact del pipeline. No cambia el resultado: el comando sigue
      // terminando con error si un test falla o si no se llega al umbral.
      reportOnFailure: true,
      // UMBRAL (el "quality gate"): si el porcentaje GLOBAL queda por debajo de alguno de estos
      // numeros, vitest termina con error (exit code 1) y el job del pipeline se pone rojo.
      // Medicion de partida: lineas 100 %, ramas 100 % (src/lib es logica pura y esta toda probada).
      // Se eligio 95, ~5 puntos por debajo:
      //  - exigir 100 romperia el build por una sola rama defensiva (ej. un "??");
      //  - un piso bajo (ej. 80) dejaria pasar funciones nuevas sin tests: aca ya con una
      //    funcion nueva de 3 lineas y un if, sin test, el porcentaje baja de 95.
      // Es mas alto que el del backend porque aca solo se mide la capa de logica pura,
      // que se puede probar completa sin DOM.
      thresholds: {
        lines: 95,
        branches: 95,
      },
    },
  },
})
