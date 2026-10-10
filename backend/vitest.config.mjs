import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Solo se ejecutan los archivos de la carpeta tests/
    include: ['tests/**/*.test.js'],
    // El backend es Node puro: no hace falta simular un navegador
    environment: 'node',

    // COVERAGE (se mide con: npm run test:coverage). Si no llega al umbral, el comando falla.
    coverage: {
      // v8 = el cobertor que viene dentro de Node (no instrumenta el codigo, mide al ejecutar)
      provider: 'v8',
      // QUE SE MIDE: los .js de la raiz del backend (hoy: index.js, que tiene TODA la logica:
      // validaciones, crear/actualizar/eliminar y las rutas). Un archivo nuevo en la raiz
      // entra solo en la medicion, y si no tiene tests, baja el porcentaje.
      include: ['*.js'],
      // QUE NO SE MIDE: db.js, que solo configura el pool de conexion a PostgreSQL con las
      // variables de entorno (configuracion pura, sin logica propia).
      // Los tests (tests/) y vitest.config.mjs quedan fuera porque no estan en el include.
      exclude: ['db.js'],
      // Salidas: text = tabla en la consola/log; html = reporte navegable (coverage/index.html);
      // lcov = formato estandar de herramientas; json-summary = totales faciles de leer por un script
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      // UMBRAL (el "quality gate"): si el porcentaje GLOBAL queda por debajo de alguno de estos
      // numeros, vitest termina con error (exit code 1) y el job del pipeline se pone rojo.
      // Medicion de partida: lineas 75.6 %, ramas 87.83 %. Se eligio ~5 puntos por debajo:
      //  - un piso que no frena nada (ej. 50) deja pasar que borren casi todos los tests;
      //  - uno pegado al numero actual (75) se rompe con UNA linea nueva sin test.
      // Con 70 / 80, una funcion de ~7 lineas con varios if y sin tests ya lo pone rojo.
      // El techo realista del backend NO es 100: las rutas HTTP, /health y app.listen
      // (~15 lineas de index.js) no se prueban con unit tests, sino en la integracion de TP7.
      // Se miden lineas Y ramas (la consigna pide reportar ramas); funciones no se exige.
      thresholds: {
        lines: 70,
        branches: 80,
      },
    },
  },
})
