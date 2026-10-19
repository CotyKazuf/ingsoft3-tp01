# Enlaces de este TP (TP6)

- **Package del backend en GHCR** (imagen publicada por el pipeline, tag `sha-<commit>`): https://github.com/CotyKazuf/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend/1367259687?tag=sha-1ec006b3ad9387b72c6611364995e5728fe0a927
- **Package del frontend en GHCR** (ídem): https://github.com/CotyKazuf/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend/1367259250?tag=sha-1ec006b3ad9387b72c6611364995e5728fe0a927
- **Corrida de un PR donde la publicación quedó salteada** (PR #35, job `build-backend`: el paso «Entrar al registry» quedó salteado y la imagen se construyó sin publicarse): https://github.com/CotyKazuf/ingsoft3-tp01/actions/runs/38090816701/job/114326691978
- **Corrida de `main` donde la publicación es el último paso del job** (CI #29, segundo intento, job `build-backend`): https://github.com/CotyKazuf/ingsoft3-tp01/actions/runs/38091406830/job/114330514660
- **QA:** frontend https://misgastos-front-qa.onrender.com — API https://misgastos-api-qa.onrender.com
- **PROD:** frontend https://misgastos-front-prod.onrender.com — API https://misgastos-api-prod.onrender.com

Evidencia de la cadena a producción (también se explica más abajo en la sección TP6):

- **Deploy automático a QA con smoke test** (CI #32, commit `e31167e`, PR #36): https://github.com/CotyKazuf/ingsoft3-tp01/actions/runs/38183357186
- **Promoción a PROD rechazada** (CI #34, commit `6ee0c47`, PR #37; con el motivo escrito): https://github.com/CotyKazuf/ingsoft3-tp01/actions/runs/38289788599
- **Promoción a PROD aprobada y desplegada** (CI #36, commit `a26c8c4`, PR #38; QA verde → Waiting for review → aprobación → PROD con smoke verde): https://github.com/CotyKazuf/ingsoft3-tp01/actions/runs/38301507642
- **Registro de deployments del environment `production`** (el rechazo de CI #34 y el deploy activo de CI #36): https://github.com/CotyKazuf/ingsoft3-tp01/deployments
- **Release `v6.0.0`:** https://github.com/CotyKazuf/ingsoft3-tp01/releases/tag/v6.0.0 (se crea al cierre del TP, sobre el commit realmente desplegado en PROD)

---

# Decisiones — TP1

## 1. Conflicto de merge

Git no pudo resolver el conflicto automáticamente porque las ramas `feature/titulo-a` y `feature/titulo-b` modificaron de manera diferente la misma línea del archivo `README.md`.

El conflicto no habría aparecido si las ramas hubieran modificado líneas distintas o si una de las ramas se hubiera actualizado con los cambios de `main` antes de realizar su modificación.

Para resolverlo, revisé las dos versiones que Git mostraba mediante los marcadores de conflicto y decidí conservar la versión B del título.

## 2. Problemas encontrados

Durante el trabajo tuve un problema al ejecutar `git pull` porque estaba ubicada en una carpeta que correspondía a otro repositorio. El comando intentaba conectarse a un remoto incorrecto.

Lo solucioné entrando a la carpeta correcta del repositorio `ingsoft3-tp01` y ejecutando nuevamente `git pull`.

También fue necesario configurar correctamente la protección de la rama `main` para impedir los pushes directos y permitir que los cambios ingresaran únicamente mediante Pull Requests.

## 3. Uso de inteligencia artificial

Utilicé ChatGPT como apoyo para interpretar la consigna del trabajo práctico, comprender el significado de los comandos de Git y seguir el procedimiento paso a paso.

Verifiqué las indicaciones observando los resultados de cada comando en la terminal y comprobando en GitHub que las ramas, Pull Requests, protecciones, conflictos, tags y releases se comportaran de acuerdo con lo indicado en la guía de la cátedra.



## TP2

### Por qué elegí "Mis Gastos" (criterios de la guía, §3.3)

Elegí seguir desarrollando mi propia aplicación, "Mis Gastos" (un registro de gastos
personales), en vez de adaptar un proyecto de GitHub. La evalúo contra los 4 criterios
que pide la guía:

- **¿Buildea y corre localmente hoy, sin magia?** Sí. La vengo probando desde el
  principio en mi propia máquina (backend Node/Express, frontend React/Vite,
  PostgreSQL), y en este mismo TP2 quedó demostrado que también levanta
  containerizada, de punta a punta, con un solo comando (`docker compose up -d --build`).
- **¿Tiene o puede tener tests?** Todavía no tiene tests automatizados — es una deuda
  pendiente que me toca resolver en el TP5. Al ser una app simple (Express + React,
  sin lógica compleja), agregar tests unitarios y de integración más adelante es viable
  sin tener que rehacer nada de lo ya construido.
- **¿Entiendo el código lo suficiente como para modificarlo?** Totalmente: la escribí
  yo desde cero, no es un fork ni un proyecto adaptado, así que conozco cada archivo y
  cada decisión que se tomó.
- **Tamaño (CRUD + 2-3 pantallas):** Cumple justo lo pedido: tiene 3 pantallas (listado
  de gastos, formulario de alta/edición, y resumen mensual) y un CRUD completo de
  gastos (alta, listado, edición, baja), sin funcionalidad de más que sume fricción sin
  sumar nota.

### Problemas y cómo se resolvieron

Al probar los endpoints del backend localmente en Windows con PowerShell, tanto `curl` (que en PowerShell es en realidad un alias de `Invoke-WebRequest`) como `curl.exe` con comillas escapadas fallaron: PowerShell no maneja bien el escapado de comillas dobles al pasarle argumentos a un programa externo, lo que hacía llegar el JSON roto al backend.

Se resolvió usando el cmdlet nativo de PowerShell `Invoke-RestMethod`, armando el body como un objeto de PowerShell y convirtiéndolo con `ConvertTo-Json` antes de enviarlo — así se evita depender del escapado de comillas en la línea de comandos.


Al conectar el backend a PostgreSQL, la librería `dotenv` (usada para leer el archivo `.env`) mostró en la consola un mensaje de "tip" con un link a un proyecto externo del propio autor de la librería (`vestauth.com`). Se verificó que el paquete instalado es el oficial —el hash de integridad coincide con el registrado en npm y el código fuente corresponde al repositorio oficial `motdotla/dotenv`—: es una función real de las versiones recientes de la librería que muestra tips aleatorios, no un problema de seguridad. Se resolvió agregando la opción `{ quiet: true }` a `dotenv.config()` para que no aparezca ningún mensaje adicional en consola durante la demostración.

Al armar el Dockerfile multi-stage del backend, después de un build exitoso, el comando `docker images node` no mostraba ninguna fila (tabla vacía), aunque el Dockerfile usa `node:20` y `node:20-alpine` como imágenes base. Se debe a que, con el motor de build (BuildKit) que usa Docker Desktop, las imágenes base referenciadas en el `FROM` se descargan solo para el build y no quedan registradas como imágenes sueltas en el listado local. Se resolvió bajando esas dos imágenes explícitamente con `docker pull node:20` y `docker pull node:20-alpine`, lo que sí las agrega al listado y permite compararlas con el tamaño de la imagen final.

### Decisiones tomadas — TP2 (Dockerfile del backend)

- Se usó un build multi-stage: una etapa `build` con la imagen `node:20` (completa, con todo lo necesario para instalar dependencias) y una etapa `final` con `node:20-alpine` (liviana), copiando a la etapa final únicamente el resultado ya armado (`node_modules` instalado + código) con `COPY --from=build`. Esto evita que la imagen que se ejecuta cargue con herramientas de compilación que solo hacen falta durante el build.
- En el Dockerfile se copian primero `package.json` y `package-lock.json`, y recién después el resto del código fuente. Así, mientras esos dos archivos no cambien, Docker reutiliza la capa cacheada de `npm ci` en builds siguientes aunque se haya modificado el código.
- El `.dockerignore` del backend excluye `node_modules/`, `.env`, `.env.example` y los logs de npm, para no filtrar secretos ni arrastrar dependencias locales al contexto del build.
- Para probar el contenedor conectándose a la base de datos real (que corre en Windows, fuera de Docker), se usó `--add-host=host.docker.internal:host-gateway` y `DB_HOST=host.docker.internal` en vez de `localhost`, ya que el contenedor no comparte la red del host.

### Decisiones tomadas — TP2 (Dockerfile del frontend)

- Se usó también build multi-stage: una etapa con `node:20-alpine` que corre `npm ci` y `npm run build` (genera la carpeta `dist/` con los archivos estáticos de React), y una etapa final basada en `nginx:alpine` que solo contiene esos archivos ya compilados. El contenedor final no tiene Node instalado, porque una vez compilado el frontend no hace falta: solo hay que servir archivos estáticos.
- En `nginx.conf`, el `location /` usa `try_files $uri $uri/ /index.html` para que las rutas de React Router (como `/resumen`) devuelvan `index.html` en vez de un 404, ya que esas rutas no son archivos reales del lado del servidor.
- El proxy hacia el backend (`location /api/`) usa una variable (`set $backend_api ...`) en vez de escribir el nombre `backend` directo en el `proxy_pass`. Así nginx resuelve ese nombre recién cuando llega un pedido real, y no al arrancar — lo que le permite al contenedor del frontend levantar solo (como se probó en esta fase) sin depender de que el backend ya exista.
- Se probó el contenedor del frontend de forma aislada (sin Compose) para confirmar que nginx sirve bien la aplicación React. Como es esperable, el listado de gastos no cargó porque el nombre `backend` todavía no resuelve a ningún contenedor real — eso se resuelve en la fase de Docker Compose.

### Decisiones tomadas — TP2 (Docker Compose)

- **Comunicación entre servicios:** `frontend`, `backend` y `db` se hablan siempre por
  nombre de servicio, nunca por IP fija ni por `localhost` — Compose crea una red
  interna con un DNS propio que resuelve esos nombres a la IP real de cada contenedor.
  Es la misma razón por la que `nginx.conf` usa `backend` en el `proxy_pass`, y por la
  que `docker-compose.yml` le pasa `DB_HOST: db` al backend.
- El `docker-compose.yml` declara 3 servicios (`db`, `backend`, `frontend`) conectados por la red interna que crea Compose automáticamente, más un volumen (`db_data`) para la base de datos.
- Al servicio `db` se le montó, además del volumen persistente, el archivo `backend/db/init.sql` en `/docker-entrypoint-initdb.d/init.sql` — la imagen oficial de Postgres ejecuta automáticamente cualquier script `.sql` que encuentre ahí la primera vez que arranca con un volumen vacío. Así la tabla `gastos` se crea sola, sin pasos manuales.
- El healthcheck de `db` usa `pg_isready`, y el `backend` usa `depends_on: condition: service_healthy` (no un `depends_on` simple) para no arrancar hasta que Postgres esté realmente aceptando conexiones, no solo iniciado.
- Los secretos (usuario, contraseña y nombre de la base) se sacaron a un `.env` en la raíz, ignorado por git, con un `.env.example` commiteado como plantilla — se verificó con `git check-ignore -v .env` que el `.gitignore` ya existente lo cubre, sin necesidad de agregar una regla nueva.
- Se probó explícitamente la diferencia entre `docker compose down` (los datos sobreviven porque el volumen no se toca) y `docker compose down -v` (el volumen se borra junto con los contenedores y los datos se pierden), cargando gastos de prueba en cada caso y verificando el resultado en la aplicación.
- La base de datos que usa este Compose es independiente de la base de Postgres local de Windows usada durante el desarrollo (F3/F4): son dos instancias completamente separadas, cada una con sus propios datos.

### Decisiones tomadas — TP2 (Publicación en GHCR)

- Se eligió GHCR (`ghcr.io`) como registry, autenticando con un Personal Access Token (scope `write:packages`) en vez de la contraseña de la cuenta de GitHub.
- Las imágenes se etiquetaron como `ghcr.io/cotykazuf/ingsoft3-tp01-backend:v0.1.0` y `ghcr.io/cotykazuf/ingsoft3-tp01-frontend:v0.1.0` — el formato `ghcr.io/<usuario>/<nombre>:<tag>` es el que exige GHCR para poder resolver a qué cuenta pertenece cada imagen.
- Se creó `docker-compose.registry.yml` como archivo separado del `docker-compose.yml` original: `backend` y `frontend` usan `image:` (apuntando a GHCR) en lugar de `build:`, para que Compose las descargue en vez de construirlas desde el código local.
- Para probar de verdad que el sistema levanta con las imágenes publicadas (y no con una copia local con el mismo nombre), se borraron explícitamente las imágenes locales con `docker rmi` antes de cada prueba con `docker compose -f docker-compose.registry.yml up`. El log mostró `Pulled` para ambos servicios, confirmando la descarga real.
- Para demostrar que las imágenes son públicas de verdad (y no accesibles solo porque la sesión seguía autenticada), se repitió la prueba después de un `docker logout ghcr.io` explícito — funcionó igual, sin ninguna credencial activa.
- La visibilidad de ambos paquetes se cambió a pública manualmente desde GitHub (Package settings → Change visibility), ya que por defecto un paquete subido a una cuenta personal de GHCR queda privado.

### Uso de inteligencia artificial (TP2)

Utilicé Claude (Anthropic) como apoyo para escribir los Dockerfiles multi-stage, el
`nginx.conf`, el `docker-compose.yml` y el `docker-compose.registry.yml`, y para
entender los conceptos de Docker involucrados en cada paso (capas y cache, healthchecks,
DNS interno de Compose, diferencia entre `.env` y `.env.example`, qué es un registry).

Cómo verifiqué lo que generó: no di por buena ninguna configuración sin probarla yo
misma en mi propia terminal. Cada Dockerfile se probó con un build y un run reales antes
de pasar a la siguiente fase; la conexión a la base de datos se verificó con el endpoint
`/health`; el `docker-compose.yml` se probó levantando el sistema completo y usándolo
desde el navegador; la persistencia se verificó de manera explícita en las dos
direcciones (`down` conserva los datos, `down -v` los borra); y la publicación en el
registry se verificó de la forma más exigente posible, repitiendo la prueba de arranque
después de desloguearme de GHCR, para confirmar que las imágenes son públicas de verdad
y no accesibles solo porque tenía sesión iniciada. Además, contrasté cada archivo
generado contra la consigna oficial del TP2, línea por línea, antes de darlo por
terminado.
## TP3

### Duración del sprint

Elegí un sprint de 2 días (miércoles 2/9 a viernes 4/9), en vez de una duración típica de
industria (1 a 4 semanas). La razón es el calendario real de la cursada: el único hito
confirmado que tengo es la defensa de P1 el viernes 4/9, así que el sprint cubre exactamente
la ventana de tiempo que tengo disponible hasta ese momento. Un sprint de una o dos semanas,
como se ve en proyectos de industria, ni siquiera terminaría antes de tener que mostrar el
trabajo — no tendría sentido para mi contexto real.

### Límite de trabajo en progreso (WIP)

Configuré el límite en 2, aplicando la regla de arranque "cantidad de personas + 1": trabajo
sola (1 persona), entonces 1 + 1 = 2. El "+1" es la válvula para el caso real de que una
tarjeta quede esperando algo (por ejemplo, una revisión) y necesite avanzar en otra cosa sin
quedarme frenada — pero sin subir tanto el número que el límite deje de cumplir su función,
que es forzar a terminar antes de empezar algo nuevo.

### Diagnóstico de la historia mal escrita

La historia de ejemplo "Como desarrollador quiero crear la tabla usuarios para guardar los
datos" está mal escrita porque es una tarea técnica disfrazada de historia: nadie "quiere"
una tabla, no tiene beneficio real para un usuario. La reescribiría como "Como usuario quiero
registrarme con usuario y contraseña para poder acceder a mis datos personales" — ahí la tabla
de usuarios pasa a ser una tarea necesaria para cumplir esa historia, no la historia en sí.

### Problemas y cómo se resolvieron (TP3)

El problema no fue técnico sino de familiaridad con la herramienta: hasta este TP solo había
usado GitHub para lo básico (pushear y clonar repositorios), así que ubicar las funciones
nuevas — dónde crear un label, cómo vincular un sub-issue, dónde estaba el campo Iteration o
el límite de WIP, dónde ver los Workflows del Project — me costó al principio, simplemente
por no conocer la interfaz de Issues y Projects. Se resolvió yendo paso a paso, verificando
con una captura cada configuración antes de pasar a la siguiente, en vez de asumir que algo
había quedado bien.

### Uso de inteligencia artificial (TP3)

Utilicé Claude (Anthropic) como apoyo para entender los conceptos de gestión ágil de este TP
(épica, historia, tarea, bug, criterios de aceptación, INVEST, WIP limit) y para redactar el
contenido de los issues (títulos, cuerpos, criterios de aceptación) y el esqueleto del workflow
de CI, siguiendo lo que pide la consigna oficial.

Cómo verifiqué lo que generó: no di por buena ninguna configuración sin comprobarla yo misma
en GitHub. Cada issue, cada vínculo de sub-issue, el límite de WIP, la asignación al sprint y
la automatización se verificaron con capturas reales de mi propio repositorio antes de darlos
por hechos — no confié en que "debería haber quedado bien". La trazabilidad (PR #22 con
`Closes #18`) se verificó de punta a punta: confirmé que la tarea #18 quedó cerrada, que se
movió sola a Done, que quedó enlazada al PR que la cerró, y que la historia #17 no se cerró
por error junto con ella.

## F4 — Frontend funcional

### Alcance

Se armó el frontend en React + Vite: listado de gastos, alta, edición, baja, total general,
total por categoría y filtro por categoría (lo pedido en el enunciado), más dos cosas
agregadas por fuera del enunciado original: filtro por mes y una pantalla de resumen mensual
(`/resumen`) con el total gastado en cada uno de los 12 meses del año en curso. Todas las
llamadas al backend usan rutas relativas `/api/...` (sin URLs absolutas hardcodeadas),
resueltas por el proxy que ya trae configurado `vite.config.js` hacia `http://localhost:3000`.

### Problemas encontrados y cómo se resolvieron

- **Errores del backend que no se veían en pantalla.** El formulario de alta/edición, y por
  separado la función de eliminar un gasto, llamaban a `fetch(...)` y asumían éxito apenas
  llegaba cualquier respuesta del servidor, sin revisar el código de estado HTTP. `fetch()` en
  JavaScript solo rechaza la promesa ante un error de red, no ante un status 4xx/5xx — hay que
  chequear `response.ok` a mano. Por esto, si el backend rechazaba un gasto (por ejemplo, un
  monto negativo) o fallaba al eliminar uno, la aplicación actuaba como si hubiera funcionado:
  limpiaba el formulario o refrescaba la lista sin avisar nada. Se corrigió en los dos lugares,
  agregando el chequeo de `res.ok` y mostrando el mensaje de error que devuelve el backend
  (con un cartel en el formulario, y con `alert()` en el caso de eliminar).

- **El backend solo validaba datos al crear un gasto (POST), no al editarlo (PUT).** Se podía
  crear un gasto válido y después editarlo para ponerle un monto negativo o una fecha inválida,
  sin ningún control. Se extrajo la validación a una función compartida
  (`validarCamposGasto`) usada por las dos rutas, con un modo "parcial" para el PUT (valida
  solo los campos que vengan en el body).

- **Los inputs del formulario se veían negros, con letra apenas legible.** Faltaba un
  `background` explícito en `.campo input, .campo select`; sin eso, el navegador aplicaba su
  modo oscuro automático. Se agregó `background` y `color-scheme: light` a esa regla.

- **El formulario dejaba cargar fechas futuras y fechas de cualquier año** (se probó, a
  propósito, con una fecha de 2004). Se agregó validación de fecha en el backend (no futura, y
  del año en curso) y los atributos `min`/`max` en el input de fecha del frontend para que el
  selector del navegador ni siquiera deje elegir un día fuera de rango. El gasto de prueba con
  fecha 2004 que había quedado cargado desde antes de esta validación se corrigió editándolo
  desde la propia aplicación.

### Decisiones tomadas

- La app trabaja siempre sobre el año en curso (calculado con `new Date().getFullYear()`, no
  un número fijo), en vez de tener un selector de año — se descartó el selector por ser más
  complejo de lo que hacía falta para el objetivo real (evitar fechas sin sentido).
- El filtro por mes y la pantalla de resumen mensual se agregaron como funcionalidad extra,
  fuera de los 6 puntos pedidos en el enunciado de F4 (listado, alta, edición, baja, total,
  filtro por categoría) — se aclara para que no se confunda con un requisito.
- Se mantuvo un único componente de formulario (`FormularioGasto.jsx`) para alta y edición, en
  vez de dos componentes separados, condicionando el comportamiento según si llega un gasto a
  editar.

### Uso de inteligencia artificial

Se utilizó Claude (Anthropic) como apoyo para escribir el frontend en React, revisar y corregir
el backend, y para pensar el alcance de esta fase. Cada cambio se explicó y se verificó antes de
aplicarlo: se revisó el código generado, se probaron los casos manualmente en el navegador
(incluyendo forzar errores a propósito, como pedir eliminar un gasto inexistente para confirmar
que el mensaje de error apareciera), y los commits y el Pull Request se hicieron y revisaron por
cuenta propia.

## TP4

### Estructura elegida del pipeline

El workflow (`.github/workflows/ci.yml`) tiene dos jobs, `build-backend` y `build-frontend`, uno por
cada Dockerfile del TP2. No hay una razón artificial para tener dos: la app tiene efectivamente dos
imágenes separadas (backend Express y frontend React/Vite servido por nginx), así que el pipeline
construye exactamente eso, ni más ni menos. Corren en paralelo porque no tienen ninguna dependencia
entre sí — GitHub Actions ejecuta todos los jobs de un workflow al mismo tiempo salvo que se declare
`needs:`, y como construir el backend no depende de construir el frontend (ni viceversa), no había
motivo para forzar una secuencia y hacer esperar un build al otro. El trigger es `pull_request` y
`push` sobre `main`, para que corra tanto en cada PR (antes de mergear) como en cada push directo a
`main`.

### Cache

Se cachean las capas intermedias de la construcción de cada imagen Docker (por ejemplo, la capa de
`npm ci`, la más pesada y la que menos cambia entre builds). El cache vive en el almacenamiento propio
de GitHub Actions (`type=gha`), no en el disco del runner ni en Docker local — por eso hace falta
`docker/setup-buildx-action`, porque el driver de Docker por defecto no soporta exportar cache. Cada
job usa un `scope` distinto (`backend`/`frontend`) para que no se pisen el cache entre sí. Si el cache
desaparece (GitHub lo puede evictar en cualquier momento, tiene límites de tamaño y política propia de
expiración), el pipeline no se rompe: simplemente vuelve a construir todas las capas desde cero, más
lento, pero funciona igual. Que el pipeline dependiera de que el cache exista sería un bug — el cache
es una optimización de velocidad, no un requisito de funcionamiento.

### Por qué construye con el Dockerfile en vez de compilar por su cuenta

El pipeline no reimplementa la lógica de build con comandos en el YAML (no hace
`npm install && npm run build` directamente en un step) — usa `docker/build-push-action` apuntando a
los Dockerfiles reales del TP2 (`./backend`, `./frontend`). La razón es evitar tener dos definiciones
de "cómo se construye la app" que puedan divergir con el tiempo: si el día de mañana cambio el
Dockerfile, el pipeline automáticamente construye con esa versión nueva, porque usa el mismo archivo
que se usa para desplegar. Si la lógica estuviera duplicada en el workflow, cada cambio en el
Dockerfile obligaría a acordarse de actualizar también el YAML, y tarde o temprano se
desincronizarían.

### Problemas encontrados y cómo se resolvieron

Docker Desktop no estaba corriendo al intentar reproducir localmente la rotura intencional del build
— el error fue de conexión al motor de Docker, no del build en sí; se resolvió abriendo Docker Desktop
y esperando a que arrancara. Al preparar el segundo PR de la demostración de "Update branch", el
comando `git commit -am` se llevó de arrastre cambios sin commitear que había en la carpeta de trabajo
y que no correspondían a ese cambio, generando un conflicto real contra `main`; se resolvió cerrando
ese PR sin mergear, borrando la rama, y rehaciendo el commit con `git add <archivo>` puntual en vez de
`-am`. La primera corrida de cache no mostró `CACHED` en el log — no fue un error sino lo esperado,
porque `main` todavía no tenía ninguna corrida previa configurada para reutilizar; se confirmó el
funcionamiento con una segunda corrida sobre el mismo PR.

### Uso de inteligencia artificial

Utilicé Claude (Anthropic) como apoyo para entender los conceptos de integración continua de este TP
(workflow, job, step, runner, trigger, cache de capas, gate de PR) y para escribir y ajustar el
`ci.yml` de forma incremental (workflow básico primero, cache después, gate al final), siguiendo el
orden que indica la guía. Cada cambio se explicó antes de aplicarlo, y se verificó con corridas reales
en GitHub Actions: los checks en verde y en rojo, el cache con `CACHED` en el log, el botón de merge
bloqueado y habilitado, y el botón "Update branch" se comprobaron mirando la interfaz real de GitHub.

## TP5

### Herramienta elegida

Usé Vitest (con `@vitest/coverage-v8`) tanto en el backend como en el frontend, en vez de Jest en un lado y
otra cosa en el otro. La razón es práctica: es un solo runner y una sola forma de configurar tests y coverage
(`vitest.config.mjs` en el backend y `vitest.config.js` en el frontend), y el frontend ya usaba Vite, y Vitest
usa ese mismo motor. Elegí la versión 4.1.11 y no la 5 porque la 5 exige Node 22.12 o
más y los Dockerfiles de los TP anteriores usan `node:20`; cambiar la versión de Node de las imágenes no tenía
nada que ver con este TP. Los scripts son `npm test` (`vitest run`) y `npm run test:coverage`
(`vitest run --coverage`). El provider de coverage es v8, que mide lo que Node ejecuta realmente y no necesita
instrumentar el código.

### Qué lógica elegí testear y por qué

Elegí la lógica que tiene reglas de negocio y que se puede probar sin levantar nada: en el backend, las
**reglas de validación de un gasto** (`validarCamposGasto`) y las **operaciones de crear, actualizar y eliminar**
(`crearGasto`, `actualizarGasto`, `eliminarGasto`), que deciden qué status y qué cuerpo se responde; en el
frontend, la **lógica pura de `src/lib/`** (totales, filtros por categoría y mes, totales por categoría y por
mes, armado del cuerpo del POST/PUT, formato de fecha) y el **cliente de la API** (`guardarGastoEnApi`,
`eliminarGastoEnApi`). Dejé afuera lo que es pantalla (componentes React) y lo que es conexión real a PostgreSQL,
porque probarlo bien exige navegador y base de datos reales, y eso corresponde a las pruebas de integración y e2e
del TP7.

### Refactors para testabilidad

El código original mezclaba la lógica con Express, con el pool de PostgreSQL y con React, y así no se podía probar
una regla sin levantar todo. Hice refactors mínimos, sin cambiar el comportamiento:

- **Backend:** `validarCamposGasto` se exporta de `index.js`. `crearGasto(db, datos)`,
  `actualizarGasto(db, id, datos)` y `eliminarGasto(db, id)` reciben la base como parámetro (`db`, cualquier
  objeto con un método `.query`) y devuelven `{ status, body }`; las rutas de Express solo llaman a esas
  funciones con el pool real y mandan la respuesta. `app.listen` quedó dentro de `if (require.main === module)`
  para que importar `index.js` desde un test no abra un puerto.
- **Frontend:** saqué la lógica de los componentes a `src/lib/constantes.js`, `src/lib/gastos.js` y
  `src/lib/api.js`, y los componentes (`Principal`, `ResumenAnual`, `FormularioGasto`, `App`) ahora usan esas
  funciones. `guardarGastoEnApi` y `eliminarGastoEnApi` reciben `fetchFn` (por defecto el `fetch` real).

La app sigue usando el pool y el `fetch` reales, y las rutas siguen siendo `/api/...` relativas. Se comprobó que
el comportamiento no cambió (ver "Cómo verifiqué lo que produjo la IA").

### Suite del backend

Son 33 métodos de test, 56 casos en total, en tres archivos. `tests/validaciones.test.js` (14 métodos) cubre
seis reglas distintas de `validarCamposGasto`: el monto debe ser un número mayor a 0, la descripción es
obligatoria, la fecha debe ser válida, no futura y del año actual, la categoría y el medio de pago deben estar en
las listas permitidas, el tipo de tarjeta es opcional pero si viene debe ser Débito o Crédito, y la
actualización (PUT) es parcial. `tests/gastos.test.js` (7 métodos) prueba `crearGasto`, `actualizarGasto` y
`eliminarGasto` con la base mockeada. `tests/resumen.test.js` (12 métodos) prueba `resumirGastos` y salió del
primer PR (ver más abajo). Los tests siguen el patrón Arrange-Act-Assert y fijan la fecha de "hoy" con
`vi.setSystemTime` para que den lo mismo cualquier día y en cualquier zona horaria.

### Suite del frontend

Son 15 métodos de test, 26 casos, sin DOM (entorno `node`, sin jsdom): `src/lib/gastos.test.js` (9 métodos)
prueba `calcularTotal`, `filtrarGastos`, `totalesPorCategoria`, `totalesPorMes`, `formatearFecha` y
`construirDatosGasto`; `src/lib/api.test.js` (6 métodos) prueba `mensajeDeError`, `guardarGastoEnApi` y
`eliminarGastoEnApi`.

### Parametrizados, casos de error y mocks

**Parametrizados (`it.each`).** Backend: 7 (por ejemplo, los montos inválidos `0`, negativo, texto y `null`
contra la misma regla; los meses válidos e inválidos de `resumirGastos`). Frontend: 6 (por ejemplo, las
combinaciones de filtro categoría/mes de `filtrarGastos` y los mensajes de error de `mensajeDeError`). Uso
`it.each` cuando la misma regla se prueba con varias entradas; un caso por fila, con nombre propio en el reporte.

**Casos de error y de borde.** Backend: gasto inválido responde 400 y no llega a tocar la base; si la base falla
responde 500 con un mensaje genérico; actualizar o borrar un gasto que no existe responde 404; fecha igual a hoy
sí, mañana no; monto 0.01 sí, 0 no. Frontend: si el backend responde con error, el cliente lanza una excepción con el
mensaje del backend o con uno por defecto; si falla la red, el error de `fetch` se propaga; lista vacía devuelve total 0.

**Mocks.** Backend: en `tests/gastos.test.js` la base es `db = { query: vi.fn() }`. No se mockea para que "pase":
se comprueba la interacción, por ejemplo que el INSERT se ejecuta una sola vez y con los valores en el orden
correcto, que con datos inválidos la base no se toca, y que el UPDATE conserva los valores actuales de los campos
que no se enviaron. Frontend: en `src/lib/api.test.js` el cliente recibe `fetchFn = vi.fn()` y se comprueba a qué
URL se llama, con qué método y con qué cuerpo. Es un mock y no un simple stub porque los tests verifican cómo se
llamó, no solo qué devolvió. Lo que un mock no detecta es si el SQL o el endpoint real funcionan de verdad; eso
lo cubrirá la integración del TP7.

### Coverage: números

| | Líneas | Branches | Umbral exigido |
|---|---|---|---|
| Backend al entrar en main (`index.js` + `resumen.js`) | 80.39 % | 90 % | 70 % líneas, 80 % branches |
| Backend antes de `resumen.js` (solo `index.js`) | 75.6 % (62/82) | 87.83 % (65/74) | idem |
| Frontend (`src/lib/`) | 100 % (36/36) | 100 % (24/24) | 95 % líneas, 95 % branches |

Se mide **line coverage y branch coverage**, y los dos se exigen. Statements y funciones se muestran en el
reporte pero no se exigen: el porcentaje de funciones del backend (41.66 %) es bajo porque la capa de rutas de
Express no se prueba sin servidor, y exigirlo habría obligado a escribir tests de relleno.

### Umbral elegido, métrica y justificación

**Backend: 70 % de líneas y 80 % de branches.** Partí de lo medido (75.6 % y 87.83 %) y puse el umbral unos 5
puntos por debajo, redondeado: lo suficientemente cerca para que se note cuando se agrega lógica sin tests, y con
margen para que un cambio chico y razonable no rompa el pipeline. No usé un número arbitrario como 80 % para todo.
Lo comprobé con pruebas controladas en una copia: una función nueva de 5 `if` sin tests ya hacía fallar el
umbral (69.66 % de líneas, 77.38 % de branches), y borrar `validaciones.test.js` dejaba el backend en 67.07 % y
77.02 %, también en rojo. Hay un techo: unas 15 de las 82 líneas de `index.js` son capa HTTP (rutas, `/health`,
`listen`), que sin pruebas de integración no se ejecutan, así que no tiene sentido pedir más de lo que se puede
probar con tests unitarios.

**Frontend: 95 % de líneas y 95 % de branches.** Se mide solo `src/lib/`, que es lógica pura y está al 100 %.
Exigir 100 % rompería el build por una sola rama defensiva (por ejemplo, un `??`), y un piso bajo como 80 % dejaría
pasar funciones nuevas sin tests: con 95 %, una función nueva de 3 líneas con un `if` sin test ya hace fallar el
job (94.73 % y 92.3 % en la prueba). Es más alto que el del backend porque acá solo se mide lo que se puede
probar completo sin DOM.

**Por qué branch además de líneas.** Una línea puede estar ejecutada y la rama contraria no: con solo líneas,
un `if` sin su `else` probado pasa desapercibido.

### Qué se excluye del coverage y por qué

- **Backend:** `db.js` (crea el pool de `pg`; no tiene lógica y se prueba solo con una base real, en el TP7). El
  `include` es `*.js` de la raíz del backend, así que no entran `tests/`, `node_modules/` ni `coverage/`.
- **Frontend:** los componentes `.jsx` (`App`, `pages/`, `components/`), `main.jsx` (arranque) y los
  `*.test.js` que viven junto al código. Son pantallas: probarlas exige navegador o DOM, y eso lo cubrirá el e2e
  del TP7.

Para que no parezca que inflé el número: si en el frontend se contaran también los `.jsx`, el coverage daría
25.71 % de líneas y 63.15 % de branches. Elegí medir solo `src/lib/` porque es donde está toda la lógica no
visual, y lo digo explícitamente en lugar de esconderlo.

### Por qué un coverage alto no garantiza calidad

El coverage mide qué líneas se ejecutaron, no si algún test verificó el resultado. Un ejemplo con `resumirGastos`
de Mis Gastos: escribí en una copia un test sin ningún `expect`, que solo llamaba a la función con varios
gastos. Ese test dio **100 % de líneas y 100 % de branches** sobre `resumen.js` y pasó en verde. Después rompí a
propósito la función para que eligiera el gasto **menor** en vez del mayor (cambiar `>` por `<` en la comparación
del gasto mayor): el test sin `expect` siguió pasando con 100 %, y en cambio los tests reales de `resumen.test.js`
fallaron (2 tests en rojo). El umbral de coverage solo evita que quede código sin ejecutar; que los tests sirvan
lo da la calidad de las aserciones.

### Ejercicio de la rama o camino sin cubrir

- **Línea y camino:** `backend/index.js`, función `actualizarGasto`, el `if (errorValidacion)` de la línea 90: la
  línea 91 (`return { status: 400, ... }`) nunca se ejecuta en los tests. Es la rama "PUT con un dato inválido".
- **Entrada que la recorrería:** `actualizarGasto(db, 7, { monto: -5 })` con una base que encuentra el gasto 7.
  Lo probé en una copia y cubre la rama (líneas 75.6 % a 76.82 %, branches 87.83 % a 89.18 %).
- **Decisión tomada:** por ahora **no la cubrí**. El camino es real (hay una validación de PUT que importa), pero
  agregarlo antes de fijar el umbral movía la línea base, y el umbral se calculó sobre la medición sin ese test. Lo
  dejo documentado como el primer test a agregar si más adelante se quiere subir el umbral del backend.

### Pipeline y quality gate

Los tests no se instalan ni se ejecutan con comandos sueltos en el YAML: ambos Dockerfiles tienen una etapa
`test` (en el backend, entre `build` y `final`; en el frontend, que quedó con una etapa `deps` compartida por
`test` y `build`) cuya instrucción por defecto es `npm run test:coverage`. El workflow (`ci.yml`) construye esa
etapa con `target: test`, ejecuta `docker run --name <x>-tests`, saca el reporte con `docker cp`, escribe una
tabla de coverage en el Summary de la corrida y sube el reporte como artifact (`coverage-backend` y
`coverage-frontend`, descargables). Los pasos posteriores al `docker run` llevan `if: always()` para que el
reporte y el artifact se generen **aunque falle el umbral**, sin esconder el fallo: no hay `continue-on-error`,
ni `|| true`, ni `exit 0`. El quality gate son los mismos checks obligatorios del TP4 (`build-backend` y
`build-frontend`): si vitest no llega al umbral termina con código 1, falla el paso, el job queda rojo y GitHub
bloquea el merge. Si alguien bajara los umbrales, el gate se desactivaría; por eso cambiarlos debería pasar por
un PR con motivo.

### Primer PR: rojo por coverage, fix y merge (PR #32)

Primero abrí el PR con la base verde (sin la lógica nueva) para comprobar que el pipeline nuevo funcionaba en
GitHub: pasaron los dos checks (CI #21) y se pudo descargar el artifact. Después agregué en `backend/resumen.js`
la función `resumirGastos(gastos, mes)` (cantidad, total, promedio, gasto mayor y categoría con más gasto, con
filtro opcional por mes; 20 líneas y 16 ramas), sin tests y sin conectarla a ninguna ruta, para no agregar una
funcionalidad nueva a la app: el commit `c601377` dejó `build-backend` **en rojo** y `build-frontend` en verde.
Los 30 tests existentes pasaban; falló solo el coverage: **líneas 60.78 % contra el umbral de 70 % y branches
72.22 % contra el 80 %** (las dos métricas quedaron por debajo), y `resumen.js` figuraba con 0 %. GitHub
deshabilitó el botón de merge. Para arreglarlo el commit `795830f` agregó `backend/tests/resumen.test.js` (12
métodos, 26 casos): el cálculo normal, la lista vacía, los montos que llegan como texto (porque PostgreSQL devuelve
`NUMERIC` como texto), el redondeo a 2 decimales (`0.1 + 0.2`), los empates de monto y de categoría, el filtro
por mes (con datos, de otro mes y sin gastos), los meses válidos en los bordes, y los datos inválidos
(5 entradas que no son lista y 7 meses inválidos). Cada test corresponde a una rama o regla distinta de la
función; no cambié umbrales ni exclusiones. El resultado fue 56 tests pasando, **80.39 % de líneas y 90 % de
branches**, y el check en verde (CI #23). Hice el Squash and merge a `main` (commit `6d3c1b6`) y dejé la rama.

### Segundo PR: abierto y en rojo (PR #33)

El segundo PR (rama `tp5-segundo-pr-rojo`, commit `f0e0cd0`) agrega, sin tests, la función
`porcentajesPorCategoria` al final de `frontend/src/lib/gastos.js` (qué porcentaje del gasto total representa
cada categoría). Es un cambio distinto del primero: ahora en el frontend, así que el que falla es
`build-frontend` y el backend queda en verde. Los 26 tests existentes pasan; falla solo el coverage: en el log del job rojo
el total da **85.71 % de líneas y 92.3 % de branches contra el 95 % exigido** (`gastos.js` baja a 73.91 % de
líneas, con las líneas 64-73 sin cubrir, que son la función nueva) y el job termina con `exit code 1`. El merge
quedó deshabilitado. Los mismos números los había medido antes en local.
**Este PR queda abierto y en rojo hasta la defensa: no se mergea ni se arregla.**

### Enlaces de evidencia

- Primer PR (con historia rojo, fix, verde y merge): https://github.com/CotyKazuf/ingsoft3-tp01/pull/32
- Commit en rojo del primer PR: https://github.com/CotyKazuf/ingsoft3-tp01/commit/c601377
- Commit que lo arregla (verde): https://github.com/CotyKazuf/ingsoft3-tp01/commit/795830f
- Merge del primer PR en `main`: https://github.com/CotyKazuf/ingsoft3-tp01/commit/6d3c1b6
- Segundo PR (abierto y en rojo): https://github.com/CotyKazuf/ingsoft3-tp01/pull/33
- Commit del segundo PR: https://github.com/CotyKazuf/ingsoft3-tp01/commit/f0e0cd0
- Corrida en rojo por coverage del primer PR (CI #22, commit `c601377`): https://github.com/CotyKazuf/ingsoft3-tp01/actions/runs/38079517844
- Corrida en verde del primer PR, ya con los tests (CI #23, commit `795830f`): https://github.com/CotyKazuf/ingsoft3-tp01/actions/runs/38081710225
- Corrida en `main` después del merge del primer PR (CI #24, verde): https://github.com/CotyKazuf/ingsoft3-tp01/actions/runs/38082572682
- Corrida en rojo del segundo PR (commit `f0e0cd0`, job `build-frontend`): https://github.com/CotyKazuf/ingsoft3-tp01/actions/runs/38083243623/job/114304319427?pr=33
- Reporte de coverage descargable: en la sección Artifacts de la corrida en verde (CI #23) están `coverage-backend` y `coverage-frontend` (HTML navegable, `lcov` y `coverage-summary.json`): https://github.com/CotyKazuf/ingsoft3-tp01/actions/runs/38081710225

### Problemas encontrados y cómo se resolvieron (TP5)

- **Error de npm al instalar Vitest.** Con npm 10.9.8, `npm install vitest@4.1.x` fallaba con
  `Cannot read properties of null (reading 'edgesOut')`. Se resolvió instalando con `--legacy-peer-deps` en una
  copia de trabajo; el `package-lock.json` resultante funciona después con `npm ci` normal, que es lo que usan
  los Dockerfiles (se comprobó con npm 10.8.2, el que trae `node:20`).
- **El reporte de coverage no se generaba cuando fallaba un test.** Por defecto Vitest no escribe el reporte si
  un test falla, y el artifact quedaba vacío justo cuando más hacía falta mirarlo. Se resolvió con
  `reportOnFailure: true` en los dos `vitest.config`, y se comprobó rompiendo a propósito una aserción. No cambia
  el resultado: el comando sigue terminando con error.
- **El pipeline nuevo no se podía probar localmente.** No había Docker en el entorno donde se escribió el
  workflow. Se validó el YAML, el orden de los pasos y el comportamiento del paso de tests con una simulación, y
  la primera ejecución real fue en el PR. Por eso abrí el primer PR con la base verde antes de agregar la lógica
  sin tests: así, el rojo posterior solo podía venir del coverage y no de un error del pipeline.
- **`docker compose up` desde `backend/` usó otro `.env`.** Daba error de autenticación de PostgreSQL (`28P01`),
  `GET /api/gastos` devolvía 500 y el frontend se quedaba en blanco. Se resolvió ejecutando siempre
  `docker compose` desde la raíz del repo.
- **Comandos de Git desde la carpeta equivocada.** Dos veces corrí `git add` con rutas de la raíz estando dentro
  de `frontend/` y Git respondió que no encontraba los archivos; se resolvió ejecutándolos desde la raíz. Además,
  el checkpoint de una fase quedó sin commitear y terminó en el mismo commit que la fase siguiente.
- **Hallazgos que no corresponden a este TP y no toqué.** `npm audit` marca vulnerabilidades que ya venían de
  antes (en el backend `proxy-addr` crítica y `qs` moderada vía Express; en el frontend `source-map-js` alta vía
  Vite). El frontend se rompe (`e.reduce is not a function`) si `/api/gastos` devuelve un error en vez de una
  lista. La imagen final del backend incluye la carpeta `tests/` y `vitest.config.mjs` porque el Dockerfile hace
  `COPY . .`. Los dejé como están para no mezclar arreglos con el TP; quedan anotados.

### Uso de inteligencia artificial (TP5)

Usé Claude (Anthropic) en un proyecto de Claude en el que trabajamos por fases. La IA propuso la herramienta y los
umbrales, escribió los refactors de testabilidad, los tests del backend y del frontend, la configuración de
Vitest y de coverage, las etapas `test` de los Dockerfiles, los cambios de `ci.yml`, el código sin tests de los
dos PRs (`resumirGastos` y `porcentajesPorCategoria`) y el borrador de esta sección. Yo revisé la explicación de
cada fase antes de seguir, ejecuté todo lo de Git y GitHub (commits, pushes, branch, PRs y el merge), miré en
GitHub Actions las corridas reales en rojo y en verde, comprobé que el merge se bloqueaba y se habilitaba, y
descargué y abrí el reporte de coverage del artifact.

**Cómo se verificó lo producido por la IA.** Por parte de la IA, en una copia de trabajo (no en mi repo): cada
suite se probó con **mutaciones**, es decir, rompiendo a propósito el código real y comprobando que algún test
fallara (por ejemplo, sacar la conversión a número, cambiar un `>` por `>=` o hacer que una regex acepte el mes
13): se detectaron todas, incluidas las 6 de `resumirGastos`. Los refactors se verificaron comparando el
comportamiento antes y después: 22 requests HTTP idénticas contra una base PostgreSQL real, con el mismo SQL, y 16
escenarios de la interfaz idénticos. Las suites se corrieron con Node 20 y 22 (la de validaciones del backend, además, en cuatro zonas horarias),
y el comando de coverage se probó fallando y pasando antes de subir nada. Por mi parte, lo que vi con mis ojos fueron
las corridas reales de GitHub Actions: los números del pipeline (60.78 % y 72.22 % en rojo; 80.39 % y 90 % en
verde) coincidieron con los que la IA había medido en local antes de subir. Esas pruebas de mutación y de
equivalencia las ejecutó la IA; no las repetí yo.


## TP6

### Por qué solo se publican imágenes después de la verificación en verde

Una imagen en el registry es lo que alguien va a usar para desplegar. Si el pipeline publicara antes de correr
los tests, en el registry podría haber imágenes de commits que nunca pasaron las pruebas ni el umbral de
coverage, y después sería imposible distinguirlas de las buenas. Por eso la imagen se construye y se publica
recién al final del job, cuando ya pasaron los tests y el coverage; así, todo lo que existe en GHCR con tag
`sha-<commit>` viene de un commit que pasó el pipeline completo.

### La cadena de tres garantías

1. **Nada entra a `main` sin verde.** Los checks `build-backend` y `build-frontend` son obligatorios para
   mergear (protección de `main` del TP4, con el quality gate de coverage del TP5). Si los tests o el umbral
   fallan, GitHub bloquea el merge.
2. **Solo `main` publica.** El paso de login al registry se ejecuta solo en eventos `push`, y el paso que
   construye y publica la imagen empuja solo si `github.event_name == 'push'` y `github.ref ==
   'refs/heads/main'`. En un Pull Request el login no se ejecuta y la imagen se construye sin publicarse.
3. **La publicación es el último paso del job.** Va después de los tests, del coverage y de subir los reportes.
   Los pasos intermedios con `if: always()` son los de reportes; el paso de publicación no lo tiene, así que si
   cualquier paso anterior falla, la publicación no se ejecuta.

Evidencia: en el PR #35 el login quedó salteado y la imagen se construyó sin publicarse (tercer enlace de arriba), y en la corrida de
`main` CI #29 la publicación es el último paso real del job (cuarto enlace).

### CI, Continuous Delivery y Continuous Deployment

- **Integración continua (CI):** cada cambio se compila y se verifica de forma automática (en este proyecto:
  build, tests, coverage y umbral). Responde «¿este cambio rompe algo?».
- **Continuous Delivery:** cada cambio que pasa la verificación queda listo para producción y la salida a
  producción se hace con una decisión humana.
- **Continuous Deployment:** igual que el anterior, pero sin decisión humana: todo cambio verde llega solo a
  producción.

**Lo que implementé es Continuous Delivery con deploy automático a QA:** cada merge a `main` se despliega solo
a QA y se prueba con un smoke test, pero a PROD no llega nada sin que yo lo apruebe en el environment
`production`. Elegí no hacer Continuous Deployment porque el smoke test es chico (ver más abajo) y quiero que una
persona mire el cambio antes de que llegue a producción.

### Diseño del pipeline: `needs`, `if` y environments

- `deploy-qa` tiene `needs: [build-backend, build-frontend]`, `if: github.event_name == 'push' && github.ref ==
  'refs/heads/main'` y `environment: qa`.
- `deploy-prod` tiene `needs: deploy-qa`, el mismo `if` y `environment: production`, que tiene a un revisor
  obligatorio (yo; la opción «evitar la auto-aprobación» está desactivada porque trabajo sola). Por eso el job
  queda en **Waiting for review** antes de ejecutar ningún paso.
- `deploy-prod` usa `concurrency` con el grupo `deploy-prod` y `cancel-in-progress: false`: nunca hay dos
  deploys a PROD a la vez y uno en curso no se cancela. Lo aprendí con cuidado: un job nuevo en espera puede
  reemplazar a otro que también está esperando, así que no conviene mergear otro PR mientras hay una aprobación
  pendiente.
- Ninguno de los dos jobs de deploy usa `always()`, `!cancelled()` ni `continue-on-error`: si falla un build o
  QA, PROD queda salteado.
- En un Pull Request los dos jobs de deploy aparecen como **skipped** (se ve en los PR #37 y #38).
- Los jobs de deploy tienen `timeout-minutes: 30` y permisos mínimos (`contents: read`).

### Alcance de cada secret

- `RENDER_HOOK_API_QA` y `RENDER_HOOK_FRONT_QA` (deploy hooks de Render): secrets del **environment `qa`**.
- `RENDER_HOOK_API_PROD` y `RENDER_HOOK_FRONT_PROD`: secrets del **environment `production`**, no del
  repositorio. GitHub solo se los entrega al job `deploy-prod` después de la aprobación: en el rechazo (CI #34)
  nunca llegaron al job.
- Las credenciales de la base de datos de Neon (usuario, contraseña, host) **no están en GitHub**: viven como
  variables de entorno de cada servicio en Render. En GitHub solo hay URLs de deploy hooks.
- El pipeline usa el `GITHUB_TOKEN` automático con permiso `packages: write` solo en los jobs que publican.
- Los valores nunca se escribieron en el YAML, en commits, en este documento ni en capturas: copié cada hook de
  Render y lo pegué directo en GitHub.

### Qué mira el aprobador antes de aprobar

1. Que la corrida sea la esperada: el commit y el PR que la originaron, y qué archivos cambia (Files changed).
2. Que `build-backend`, `build-frontend` y `Desplegar en QA` estén en verde, y que el smoke de QA haya dado los 4
   chequeos en OK.
3. Que el cambio se vea en QA, que es el entorno que ya recibió esa versión (en la aprobación de CI #36, el
   subtítulo nuevo estaba en QA).
4. Que PROD todavía no tenga el cambio, para poder comprobar después la diferencia.
5. Si algo no cierra, se rechaza con un motivo escrito (ver más abajo).

### Free tier, cold starts y otros límites

- **Render Free** apaga las instancias por inactividad y la primera respuesta puede tardar 50 segundos o más.
  Por eso el smoke test reintenta (12 intentos, 15 segundos de espera entre intentos, cada pedido con un máximo
  de 60 segundos). Nginx, además, corta a los 60 segundos por defecto, así que un arranque en frío muy lento
  podría devolver un 504 en el primer pedido.
- Render ofrecía por defecto un plan pago; elegí el plan gratuito ($0) en los cuatro servicios para que el TP no
  tenga costo.
- **Neon Free:** las dos bases (`app_qa` y `app_prod`) están en el mismo proyecto, servidor y rol. La separación
  es de bases de datos, no de servidores.
- Con Auto-Deploy desactivado en los cuatro servicios de Render, solo se despliega cuando lo dispara el
  pipeline (deploy hook) o yo a mano desde el Dashboard.
- Los eventos de Render tienen precisión de minuto; para medir tiempos usé la pantalla de cada deploy, que
  muestra la hora de inicio con segundos y la duración.

### Qué quedó por variable y qué quedó adentro de la imagen

La consigna pide que la dirección del backend no esté adentro de la imagen del frontend. Quedó así.

**Imagen del frontend.** Adentro de la imagen está lo que no cambia entre entornos: la aplicación React ya
compilada (`/usr/share/nginx/html`), que llama siempre a la ruta relativa `/api/...`, y nginx con su plantilla
(`default.conf.template`). Por variable, leída cuando el contenedor arranca, quedan dos valores:

- `BACKEND_URL`: a dónde reenvía nginx lo que llega a `/api/`. En QA vale `https://misgastos-api-qa.onrender.com`
  y en PROD `https://misgastos-api-prod.onrender.com`. El valor por defecto del Dockerfile es
  `http://backend:3000`, que es el que usa `docker compose`.
- `DNS_RESOLVER`: el servidor DNS que nginx usa para resolver ese nombre. En Render vale `8.8.8.8`; el valor por
  defecto es `127.0.0.11`, el DNS interno de Docker.

La imagen oficial de nginx reemplaza esas dos variables en la plantilla cada vez que arranca. Lo comprobé con la
misma imagen local: con los valores por defecto el archivo generado apuntaba a `backend:3000` y, arrancándola con
`-e BACKEND_URL=https://misgastos-api-qa.onrender.com -e DNS_RESOLVER=8.8.8.8`, apuntaba a la API de QA de Render
(`curl http://localhost:8082/api/gastos` devolvió `[]`). Cambió el comportamiento sin reconstruir la imagen.

**Imagen del backend.** Adentro está el código de Express con sus dependencias. Por variable, configuradas en
cada servicio de Render y nunca en la imagen ni en el repositorio, quedan los datos de conexión a la base
(`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) y `PGSSLMODE=require`; el puerto (`PORT`) lo pone
Render. Lo que distingue a QA de PROD en el backend es la base: `DB_NAME` vale `app_qa` en un entorno y `app_prod`
en el otro.

**Qué no hay adentro de ninguna imagen:** ni la URL de otro entorno ni credenciales. Por eso esto hace posible el
TP7: una misma imagen publicada puede correr en QA y en PROD, y cada entorno la apunta a su propia API y su propia
base solo con variables. En este TP Render igual construye cada servicio por separado desde el repositorio (ver la
sección siguiente), así que lo que se logró hoy es que la imagen *pueda* ser la misma, no que ya lo sea.

### Qué garantía se pierde porque Render reconstruye desde el repo

En este TP, Render no ejecuta la imagen que el pipeline construyó y publicó en GHCR: recibe el deploy hook con el
commit (`ref=<commit>`) y **vuelve a construir** la imagen desde el repositorio. El commit es el mismo, pero la
construcción es otra, y podría salir distinta (por ejemplo, por un cambio en una imagen base o en una
dependencia). Se pierde la garantía de que lo que corre en QA y en PROD es exactamente lo que se verificó, que
es la idea de «construir una vez y desplegar muchas». Las imágenes de GHCR existen y están verificadas, pero
hoy no son lo que corre. Eso queda para el TP7.

### Qué prueba y qué NO prueba el smoke test

El smoke test de QA y de PROD tiene cuatro chequeos:

1. `GET /health` de la API responde con `"status":"ok"`.
2. `GET /api/gastos` de la API devuelve una lista (la API llega a la base de datos).
3. El frontend sirve la aplicación (`<div id="root">`).
4. `GET /api/gastos` a través del frontend devuelve una lista (el proxy de nginx llega a la API correcta).

**Sí prueba** que los servicios están vivos, que la API se conecta a su base y que el frontend llega a su
backend. **No prueba** que esté corriendo la versión nueva: puede pasar contra la versión anterior mientras
Render todavía está construyendo. Lo vi en CI #32 (el cuarto chequeo dio 502 en el primer intento y OK en el
segundo; muy probablemente seguía sirviendo la versión anterior, aunque no lo comprobé) y en CI #36, donde el
smoke de PROD terminó en verde en 41 segundos aunque la comprobación real de que llegó el cambio fue ver el
subtítulo en PROD y el evento de Render con el commit. Tampoco prueba escrituras (crear, editar, borrar), ni
flujos de usuario, ni rendimiento.

### Cómo se comprobó que QA y PROD usan bases distintas

Cada backend tiene su propia variable `DB_NAME` en Render (`app_qa` en QA, `app_prod` en PROD). Para comprobarlo
inserté a mano, desde el SQL Editor de Neon y con la base `app_prod` seleccionada (verifiqué con
`current_database()`), un gasto marcado `SOLO-PROD-fase26` (monto 777). Después consulté las dos APIs: la de QA
no lo lista (y en `app_qa` la búsqueda dio 0 resultados), y la de PROD lista solamente ese gasto. En QA había
tres gastos de prueba que no aparecen en PROD. Cada backend usa su propia base. Esos gastos de prueba quedaron
cargados a propósito como evidencia; más tarde, ya con el deploy de CI #36, el gasto de 777 aparece en el
frontend de PROD.

### Rechazo real de una promoción a PROD

La corrida CI #34 (commit `6ee0c47`, PR #37, que agregó el job `deploy-prod` en `ci.yml`) pasó los builds y QA
con el smoke en verde y quedó en **Waiting for review**. La rechacé con este comentario:

> Rechazo la promoción a PROD de la corrida #34 (commit 6ee0c47): el commit solo agrega el job deploy-prod en
> ci.yml y no cambia el backend ni el frontend, así que no hay ningún cambio de aplicación para entregar a los
> usuarios. QA pasó el smoke test 4 de 4, pero no corresponde redesplegar PROD sin un cambio que lo justifique.

Qué pasó: el job `Desplegar en PROD` terminó en rojo sin ejecutar ningún paso, GitHub mostró «The deployment was
rejected or didn't satisfy other protection rules» y mi comentario en la tabla «Deployment protection rules», y
en los eventos de Render de los dos servicios de PROD no apareció ningún deploy de esa corrida. Esa corrida no se
reutilizó: la aprobación se hizo en otra corrida distinta. El enlace está arriba. No supe cómo redactar el
motivo, así que se lo pedí a la IA a partir de datos que verifiqué yo (el commit toca un solo archivo,
`ci.yml`; el smoke de QA dio 4 de 4); la decisión de rechazar y el envío del comentario fueron míos.

### Aprobación y llegada a PROD

Para tener la cadena completa en otra corrida hice un cambio mínimo y visible en el frontend: un subtítulo en la
pantalla principal (PR #38, commit `a26c8c4`). La corrida CI #36 pasó los builds, el deploy a QA con smoke y
quedó en **Waiting for review**. Antes de aprobar comprobé en QA que el subtítulo ya estaba y en PROD que no. Aprobé
con el comentario «QA ya muestra el subtítulo nuevo y PROD todavía no. Apruebo la promoción del commit de este PR
a producción.»; `Desplegar en PROD` corrió (41 segundos) con el smoke en verde. En Render, el deploy del commit
`a26c8c4` en los dos servicios de PROD figura disparado por deploy hook, y en una ventana privada el frontend de
PROD muestra el subtítulo y el gasto de 777. La página de Deployments de GitHub registra el deploy activo (PR
#38, CI #36) junto al fallido (PR #37, CI #34).

### Estrategia de deployment elegida: blue-green

Contexto: Mis Gastos es una aplicación chica (un CRUD de gastos personales) con un backend, un frontend y una
base PostgreSQL por entorno, con pocos usuarios esperables (decenas) y una infraestructura gratuita (Render Free
con una instancia por servicio y Neon Free), con muy poca observabilidad.

| Estrategia | Qué exigiría en este proyecto | Decisión |
|---|---|---|
| Rolling | Al menos 2 instancias por servicio para reemplazarlas de a una; hoy hay 1, y pasar a un plan pago duplica el costo sin beneficio con tan poco tráfico. Durante el deploy conviven dos versiones. | No |
| Canary | Repartir un porcentaje del tráfico entre versiones y medir errores para decidir si se promueve. Render no lo ofrece de forma nativa en el plan que uso, y con pocos usuarios un 5 % del tráfico no da una señal confiable. | No |
| Feature flags | Modificar el código para leer flags y tener un lugar donde administrarlos. Separan el deploy del lanzamiento de una función, pero no protegen de una versión que no arranca. | Complemento a futuro |
| **Blue-green** | Dos versiones completas y un cambio de una a otra. Render hace algo equivalente por servicio: construye la versión nueva aparte, espera el health check y recién entonces le pasa el tráfico. | **Elegida** |

Elegí **blue-green** porque no agrega costo ni código, es fácil de explicar, combina con la aprobación manual que
ya existe y permite volver rápido a la versión anterior. Además tiene un caso real: en la restauración de PROD (ver
«Problemas encontrados») un deploy que no pasó el health check estuvo 18 minutos fallando y Render nunca lo marcó
como Live, o sea que no reemplazó a la versión anterior. El alcance es el de un blue-green **gestionado por la plataforma**: no controlo el balanceador
ni el momento exacto del cambio de tráfico.

**Base de datos.** Con blue-green las dos versiones usan la misma base, así que cada migración tiene que ser
compatible hacia atrás: primero agregar (columnas opcionales), después migrar los datos y recién en un deploy
posterior borrar lo viejo. Hoy el esquema es un `CREATE TABLE` que cargué a mano, sin herramienta de
migraciones, y habría que sumarla antes de cambiar el esquema en producción.

**Observabilidad que falta para ejecutarlo en serio:**

1. `/health` solo dice que el proceso está vivo y no consulta la base; falta un chequeo de disponibilidad que sí
   la toque.
2. No hay forma de saber qué commit está corriendo (un endpoint de versión con el SHA habría resuelto la
   limitación del smoke test).
3. Faltan métricas de tasa de errores 5xx y de latencia por versión; Render muestra solo CPU y memoria.
4. Faltan logs estructurados y con búsqueda.
5. Falta monitoreo externo con alertas: hoy me entero de una caída mirando a mano (el 502 de la verificación de
   QA lo vi por casualidad).
6. Faltan métricas de la base de datos (conexiones y errores) en Neon.

Con eso se podría definir un criterio de reversión, por ejemplo «si los 5xx superan cierto porcentaje durante unos
minutos después del deploy, se vuelve a la versión anterior».

**Problemas de datos que blue-green no resuelve:** una migración destructiva o incompatible; datos escritos por la
versión nueva que la anterior no entiende; la corrupción o el borrado por un bug (necesita backups o restaurar la
base, y tengo que verificar qué ventana de restauración da Neon en el plan gratuito); y que ambas versiones
comparten una sola base, así que no hay aislamiento de datos entre «blue» y «green».

### Rollback probado y su tiempo real

Probé un rollback real de PROD, con el mismo mecanismo de Render que usa el pipeline (Render construye el commit
indicado). Volví los dos servicios de PROD de `a26c8c4` (el commit con el subtítulo) a `6ee0c47`, que ya tenía
toda la configuración del TP6 y había pasado el smoke en QA (CI #34). No usé `v5.0.0` porque es anterior al nginx
con `BACKEND_URL` y no encaja con la configuración actual. Tampoco usé el botón «Rollback» de Render: llevaba al
deploy anterior del servicio, que en el frontend de PROD era el inicial (`1ec006b`, con el nginx viejo). Hice un
deploy manual del commit específico desde el Dashboard («Manual Deploy → Deploy a specific commit») en los dos
servicios.

Medí el tiempo con el reloj de Render, no con `/health` (que puede responder la versión vieja durante el build):

| Servicio | Inicio del deploy | Duración | Quedó Live |
|---|---|---|---|
| API de PROD | 5:27:51 PM | 20,0 s | ~5:28:11 PM |
| Frontend de PROD | 5:28:38 PM | 28,2 s | ~5:29:06 PM |

**Tiempo real total del rollback: ~75 segundos** (desde el inicio del deploy de la API hasta que el frontend
quedó Live). De esos 75 s, unos 47 s fueron la espera entre mis dos clics manuales; con los dos clics
simultáneos habría sido de alrededor de 28 s. La precisión es de ±1 o 2 segundos porque los clics son manuales.
Comprobé el resultado con los eventos de Render (los dos servicios Live en `6ee0c47`) y en una ventana privada: el
subtítulo desapareció y el gasto de 777 seguía en PROD. Después restauré PROD a `a26c8c4` con el mismo
procedimiento y comprobé que el subtítulo y el gasto volvían.

### Limitación: el rollback de código no revierte datos

Volver el código cambia qué versión del programa está corriendo, pero la base de datos queda como está. Si una
migración destructiva hubiera borrado una columna (por ejemplo `tarjeta` de la tabla `gastos`), volver al código
anterior no la restituye, y además ese código anterior podría romperse porque espera una columna que ya no
existe. Lo borrado solo se recupera con un backup o restaurando la base a un punto anterior. Por eso las
migraciones deberían poder convivir con la versión anterior del código. El rollback que probé no incluyó cambios
de esquema: no hubo ninguna migración en este TP.

### Problemas encontrados y cómo se resolvieron (TP6)

- **`permission_denied: write_package` al publicar.** La primera corrida de `main` con publicación (CI #29) falló
  en los dos jobs: los paquetes de GHCR del TP2 existían pero no estaban vinculados a este repositorio, así que
  el `GITHUB_TOKEN` no podía escribir. Lo resolví en cada paquete (Package settings → Manage Actions access →
  agregar el repositorio con rol Write) y volví a ejecutar los jobs fallidos. El primer intento sigue visible en el
  selector de intentos de la corrida.
- **Un comentario del template de nginx se reemplazaba como variable.** La plantilla del nginx se procesa con
  `envsubst` al arrancar, y un comentario que contenía `${...}` se sustituía. Se detectó al probar la plantilla en
  local y se corrigió reescribiendo el comentario sin esa sintaxis.
- **El script que dispara los hooks podía mostrar la respuesta de otro servicio.** Probando el script en local
  con servidores falsos se vio que un archivo de respuesta quedaba de una llamada anterior; ahora se borra antes de
  cada llamada. Se encontró antes de usarlo en el pipeline real.
- **El PR #36 quedó desactualizado respecto de `main`.** Como el PR anterior se había mergeado con squash, la
  rama quedó atrás; usé «Update branch» y no hubo conflictos.
- **El smoke test pasa contra la versión anterior mientras Render construye.** Lo vi en CI #32 (502 en el primer
  intento del chequeo del proxy, OK en el segundo). No lo oculté: está documentado como limitación del smoke
  (arriba) y queda para el TP7 resolverlo.
- **Error 502 desde el navegador después de un rato de inactividad.** Al probar QA a mano, un POST desde el navegador
  devolvió 502 (HTML) dos veces, y minutos después funcionó sin cambiar nada. La causa más probable es que la API
  Free estaba dormida o arrancando; no lo comprobé. Para el TP7, las pruebas contra QA van a necesitar
  «calentar» la API (esperas y reintentos) antes de actuar.
- **Un deploy de restauración de PROD se quedó trabado.** Al volver PROD a `a26c8c4`, el deploy de la API estuvo
  18 minutos y terminó como fallido con «Timed out waiting for health check» y «Port scan timeout reached, no
  open ports detected», aunque el log decía «Backend escuchando en el puerto 10000». El build había salido
  completamente de caché y era la misma imagen que ya se había desplegado bien, así que la causa más probable es la
  plataforma gratuita de Render; no está comprobado. Render nunca marcó ese deploy como Live, así que no reemplazó a la
  versión anterior (no comprobé durante esos minutos qué versión respondía al visitar la página). Un reintento
  manual del mismo commit funcionó.

### Uso de inteligencia artificial (TP6)

Usé Claude (Anthropic) en un proyecto de Claude en el que trabajamos por fases. La IA propuso la topología
(servicios de Render, dos bases en Neon, environments y secrets), escribió el cambio de nginx a plantilla con
`BACKEND_URL` y `DNS_RESOLVER` y el de los Dockerfiles, los cambios de `ci.yml` (publicación a GHCR, `deploy-qa`,
`deploy-prod`, el script que dispara los deploy hooks y el smoke test), el cambio visual del frontend (subtítulo),
el procedimiento de rollback, el análisis de estrategias de deployment y el borrador de esta sección. Como no
supe redactarlo, también preparó el texto del comentario de rechazo, a partir de datos que yo había verificado.

Yo hice toda la configuración externa y todo lo de Git y GitHub: creé el proyecto y las dos bases de datos en Neon, los
cuatro servicios en Render con sus variables, los environments `qa` y `production` con el revisor obligatorio y los
secrets (copiando cada hook de Render directo a GitHub), hice los commits, pushes, PRs y merges, aprobé y rechacé los
deploys a PROD, ejecuté los deploys manuales del rollback y tomé los tiempos.

### Cómo se verificó lo producido por la IA

**Por parte de la IA, en un entorno aparte sin Docker ni acceso a mis servicios:** se validó el YAML de los
workflows; se corrieron los scripts de los hooks y del smoke contra servidores falsos (el hook con y sin
parámetros en la URL, respuestas 403, secret vacío y servidor caído para ver que fallen; el smoke con reintentos
y con falla permanente); se probó el nginx real con la plantilla y `envsubst` (que cada entorno responda su
backend y que se envíe el nombre del servidor en la conexión HTTPS); y se comprobó el modelo de `needs` e `if`
(si QA falla, PROD queda salteado). Esas pruebas las ejecutó la IA; no las repetí yo.

**Por mi parte, con lo que vi con mis ojos:** probé la imagen del frontend con Docker Desktop (con los valores
por defecto de compose y con la URL de la API de QA, y comprobé con `curl` que `/api/gastos` respondía en los dos
casos); miré en GitHub Actions las corridas reales (el PR con la publicación salteada, la de `main` con la
publicación como último paso, el deploy a QA, el rechazo y la aprobación); revisé en los eventos de Render a qué
commit correspondía cada deploy y que los hooks no estuvieran cruzados; comprobé en Neon, con el selector de base
de datos, qué datos había en cada base; verifiqué a mano en el navegador (ventana privada) el cambio visual en QA y
en PROD, antes y después de aprobar y después del rollback; y medí el rollback con el reloj de Render.
