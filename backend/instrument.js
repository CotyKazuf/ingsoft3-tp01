// Inicializacion de Sentry (monitoreo de errores y de performance del backend).
// IMPORTANTE: index.js lo carga como PRIMERA linea, antes de require('express') y de
// require('pg'): Sentry necesita estar listo antes de que se carguen esas librerias
// para poder medir las rutas de Express y las consultas a PostgreSQL.
//
// El DSN (la "direccion" del proyecto en Sentry) viene SOLO de la variable de entorno
// SENTRY_DSN; nunca se escribe en el codigo. Si no esta definida (tests, desarrollo local,
// QA) Sentry no se inicializa y la aplicacion funciona exactamente igual que antes.
// El entorno que se ve en Sentry ("production", etc.) viene de SENTRY_ENVIRONMENT.
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT,

        // Performance: se mide el 100 % de los requests. Es una app de bajo trafico y el TP
        // necesita datos reales (operacion mas usada / mas lenta). Con mucho trafico se bajaria.
        tracesSampleRate: 1.0,

        // Privacidad: no se envian datos del usuario, cookies, headers, parametros de la URL ni
        // el cuerpo de los requests (ahi viaja la descripcion de los gastos), ni los parametros
        // de las consultas SQL. Sentry igual recibe el mensaje de error, el stack y la ruta.
        sendDefaultPii: false,
        dataCollection: {
            userInfo: false,
            cookies: false,
            httpHeaders: false,
            httpBodies: [],
            urlQueryParams: false,
            databaseQueryData: false,
        },

        // /health lo consultan UptimeRobot y Render cada pocos minutos: si se midiera, seria
        // la "operacion mas usada" y taparia el uso real de la aplicacion.
        integrations: [
            Sentry.httpIntegration({
                ignoreIncomingRequests: (urlPath) => urlPath.split('?')[0] === '/health',
            }),
        ],
    });
}
