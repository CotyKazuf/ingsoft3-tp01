# ---- Etapa 1: dependencias (la comparten los tests y el build) ----
FROM node:20-alpine AS deps
WORKDIR /app

# Igual que en el backend: primero los archivos que declaran las dependencias,
# asi esta capa se cachea mientras package.json y package-lock.json no cambien.
COPY package.json package-lock.json ./
RUN npm ci

# ---- Etapa de tests (NO forma parte de la imagen final) ----
# Es la receta para probar el frontend: reutiliza las dependencias de "deps" y deja como
# comando por defecto "npm run test:coverage" (tests + coverage, con umbral en
# vitest.config.js). El pipeline la invoca asi:
#   docker build --target test -t frontend:test ./frontend
#   docker run frontend:test
FROM deps AS test
COPY . .
CMD ["npm", "run", "test:coverage"]

# ---- Etapa 2: build (compila el React con Vite) ----
FROM deps AS build
COPY . .
RUN npm run build

# ---- Etapa 3: nginx sirve los archivos estaticos ya compilados ----
FROM nginx:alpine AS final
# nginx.conf paso a ser una PLANTILLA: la imagen oficial de nginx procesa
# todo lo que haya en /etc/nginx/templates/*.template al arrancar (reemplaza
# ${VARIABLES} por variables de entorno) y escribe el resultado en conf.d/.
# Los valores por defecto son los de Docker Compose; QA y PROD los pisan con
# las variables de entorno del servicio (la imagen no cambia).
ENV BACKEND_URL=http://backend:3000
ENV DNS_RESOLVER=127.0.0.11
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
