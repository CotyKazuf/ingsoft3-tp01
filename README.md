# Mis Gastos

Aplicación de seguimiento de gastos personales: backend en Node/Express, frontend en
React (Vite) servido por nginx, y base de datos PostgreSQL. Repositorio del semestre
para Ingeniería de Software III.

## Instalación

```
git clone https://github.com/CotyKazuf/ingsoft3-tp01.git
cd ingsoft3-tp01
```

## Requisitos

- Docker Desktop instalado y corriendo.

## Arranque en una máquina limpia

1. Copiar el archivo de variables de entorno y completar la contraseña:

   ```
   cp .env.example .env
   ```

   (en PowerShell/Windows: `copy .env.example .env`)

   Abrir `.env` y poner cualquier valor en `DB_PASSWORD` (no importa cuál sea, es una
   base de datos de prueba local, aislada del resto del sistema).

2. Levantar el sistema completo, construyendo las imágenes desde el código fuente:

   ```
   docker compose up -d --build
   ```

3. Esperar a que los 3 servicios estén arriba y verificar el estado:

   ```
   docker compose ps
   ```

   Tiene que verse el servicio `db` en estado `healthy`, y `backend`/`frontend`
   corriendo.

4. Abrir la aplicación en el navegador:

   ```
   http://localhost:8080
   ```

## Alternativa: levantar con las imágenes ya publicadas (sin construir nada)

En vez del paso 2, se puede usar directamente las imágenes de `backend` y `frontend`
ya publicadas en GitHub Container Registry (son públicas, no hace falta login):

```
docker compose -f docker-compose.registry.yml up -d
```

## Detener el sistema

- `docker compose down` — para los contenedores; los datos de la base **se conservan**
  (el volumen no se borra).
- `docker compose down -v` — para los contenedores y **borra también los datos**
  (la próxima vez que se levante, arranca todo desde cero).

## Puertos

- Frontend (interfaz web): http://localhost:8080
- Backend (API, para pruebas directas con curl/Postman): http://localhost:3000
