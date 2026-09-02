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
