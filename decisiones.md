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
