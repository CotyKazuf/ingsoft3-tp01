# ---- Etapa 1: build (instala las dependencias) ----
FROM node:20 AS build
WORKDIR /app

# Se copian PRIMERO solo estos dos archivos (los que declaran las dependencias),
# todavia no el resto del codigo. Es lo que hace que esta capa se pueda cachear:
# mientras package.json y package-lock.json no cambien, Docker no vuelve a
# correr "npm ci" en el proximo build, aunque hayas modificado index.js.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Recien ahora se copia el resto del codigo fuente.
COPY . .

# ---- Etapa de tests (NO forma parte de la imagen final) ----
# Es la receta para probar el backend. Instala TODAS las dependencias (tambien las de
# desarrollo, como vitest, que la etapa "build" de arriba deja afuera con --omit=dev)
# y deja como comando por defecto "npm run test:coverage": correr los tests y medir
# el coverage. El umbral esta en vitest.config.mjs; si no se llega, el comando falla.
# El pipeline la invoca asi:
#   docker build --target test -t backend:test ./backend
#   docker run backend:test
# La etapa "final" no usa esta, asi que nada de esto viaja a la imagen de produccion.
FROM node:20 AS test
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "test:coverage"]

# ---- Etapa 2: final (imagen liviana, solo lo necesario para correr) ----
FROM node:20-alpine AS final
WORKDIR /app

# Se trae SOLO el resultado ya armado de la etapa "build" (node_modules
# instalado + el codigo). No se vuelve a instalar nada aca, y no queda
# en esta imagen ningun rastro de herramientas de mas.
COPY --from=build /app .

EXPOSE 3000
CMD ["node", "index.js"]
