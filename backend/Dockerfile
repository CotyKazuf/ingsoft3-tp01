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

# ---- Etapa 2: final (imagen liviana, solo lo necesario para correr) ----
FROM node:20-alpine AS final
WORKDIR /app

# Se trae SOLO el resultado ya armado de la etapa "build" (node_modules
# instalado + el codigo). No se vuelve a instalar nada aca, y no queda
# en esta imagen ningun rastro de herramientas de mas.
COPY --from=build /app .

EXPOSE 3000
CMD ["node", "index.js"]
