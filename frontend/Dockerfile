# ---- Etapa 1: build (compila el React con Vite) ----
FROM node:20-alpine AS build
WORKDIR /app

# Igual que en el backend: primero los archivos que declaran las dependencias,
# asi esta capa se cachea mientras package.json y package-lock.json no cambien.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Etapa 2: nginx sirve los archivos estaticos ya compilados ----
FROM nginx:alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
