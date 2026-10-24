# TP8 - Preprod de Mis Gastos, parte 1: la base de datos en Neon.
#
# Esto es un entorno NUEVO y APARTE: un proyecto de Neon propio. No se declara, no se importa
# y no se lee nada de QA ni de PROD (que viven en el proyecto "misgastos" de Neon). Como
# Terraform solo gobierna lo que esta escrito en estos archivos, no puede tocarlos.
#
# La clave de la API (NEON_API_KEY) NO esta aca: el provider la lee de una variable de entorno.
# La contrasena del rol tampoco: la genera Neon al crear el rol y queda en el estado de Terraform.

resource "neon_project" "preprod" {
  name = "misgastos-preprod"

  # Neon crea los proyectos dentro de una organizacion y la API la exige: sin esta linea el
  # apply falla con "org_id is required". El valor no es un secreto, pero es de tu cuenta:
  # no se escribe aca, llega por la variable de entorno TF_VAR_neon_org_id (ver variables.tf).
  org_id = var.neon_org_id

  # Sin esta linea el primer apply falla: el provider pide por defecto 86400 segundos
  # (un dia) de historial y el tope del plan gratuito de Neon es 21600 (seis horas).
  history_retention_seconds = 21600
}

resource "neon_role" "preprod" {
  project_id = neon_project.preprod.id
  # default_branch_id, NO branch_id: asi se llama el atributo en esta version del provider.
  branch_id = neon_project.preprod.default_branch_id
  name      = "app_preprod_owner"
}

resource "neon_database" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id
  name       = "app_preprod"
  owner_name = neon_role.preprod.name
}

# ---------------------------------------------------------------------------------------
# Parte 2: los dos servicios de preprod en Render. Corren las MISMAS imagenes del TP7 que
# ya publico el pipeline en GHCR: Terraform no construye nada, solo le dice a Render que
# imagen ejecutar ("build once, deploy many"). Los nombres llevan "preprod" para no chocar
# con los servicios de QA y PROD, que Terraform no declara y por lo tanto no puede tocar.
# ---------------------------------------------------------------------------------------

locals {
  # El image_url va SIN tag: el tag es otro campo (var.image_tag).
  backend_image  = "ghcr.io/cotykazuf/ingsoft3-tp01-backend"
  frontend_image = "ghcr.io/cotykazuf/ingsoft3-tp01-frontend"
}

resource "render_web_service" "api" {
  name   = "mis-gastos-api-preprod"
  plan   = "free"
  region = var.render_region

  # /health no toca la base: dice si el proceso esta vivo (lo usa Render para saber si el
  # servicio arranco).
  health_check_path = "/health"

  runtime_source = {
    image = {
      image_url = local.backend_image
      tag       = var.image_tag
    }
  }

  # Las variables que lee backend/db.js, con los nombres EXACTOS (DB_HOST, DB_PORT, DB_USER,
  # DB_PASSWORD, DB_NAME). Ningun valor esta escrito a mano: salen de los recursos de Neon.
  # Asi Terraform sabe que primero van el proyecto, el rol y la base, y despues este servicio.
  env_vars = {
    DB_HOST     = { value = neon_project.preprod.database_host }
    DB_PORT     = { value = "5432" }
    DB_USER     = { value = neon_role.preprod.name }
    DB_PASSWORD = { value = neon_role.preprod.password }
    DB_NAME     = { value = neon_database.preprod.name }

    # Neon solo acepta conexiones con TLS; la libreria pg lee esta variable estandar de Postgres.
    PGSSLMODE = { value = "require" }
  }
}

resource "render_web_service" "front" {
  name   = "mis-gastos-front-preprod"
  plan   = "free"
  region = var.render_region

  runtime_source = {
    image = {
      image_url = local.frontend_image
      tag       = var.image_tag
    }
  }

  env_vars = {
    # La URL del backend se DERIVA del servicio de la API (nadie la copia a mano). Con esto
    # el frontend depende de la API. trimsuffix saca una barra final si Render la trajera:
    # nuestro nginx la usa en proxy_pass con una variable y una barra final cambiaria la
    # ruta que le llega al backend.
    BACKEND_URL = { value = trimsuffix(render_web_service.api.url, "/") }

    # La imagen trae por defecto 127.0.0.11 (el DNS interno de Docker Compose); en Render ese
    # DNS no existe y nginx no podria resolver el nombre de la API. Por eso se mantiene.
    DNS_RESOLVER = { value = "8.8.8.8" }
  }
}

# ---------------------------------------------------------------------------------------
# Parte 3: el esquema de la base (la tabla "gastos").
#
# Una base recien creada en Neon esta VACIA y nuestro backend no crea tablas: sin esto,
# /health responde pero /api/gastos da 500 ("relation gastos does not exist"). Este recurso
# corre backend/db/init.sql (el mismo archivo que usa Docker Compose) contra la base de
# preprod, UNA vez, justo despues de crearla. Asi un destroy + apply deja preprod igual.
#
# Como funciona: levanta un contenedor con la imagen oficial de Postgres solo para usar su
# cliente "psql" (hace falta Docker Desktop encendido al aplicar). Los datos de conexion
# salen de los recursos de Neon y viajan por variables de entorno, no por la linea de
# comandos. El SQL viaja en base64 para no pelear con las comillas de la terminal.
# Esta parte esta pensada para Windows (PowerShell), que es donde se corre el TP.
# ON_ERROR_STOP=1 hace que un error de SQL haga fallar el apply (no se esconde nada).
# ---------------------------------------------------------------------------------------
resource "terraform_data" "esquema" {
  # Se vuelve a ejecutar solo cuando la base se crea de nuevo (cambia su id). init.sql es un
  # CREATE TABLE sin "IF NOT EXISTS": correrlo dos veces sobre la misma base daria error.
  triggers_replace = [neon_database.preprod.id]

  provisioner "local-exec" {
    # Se corre con PowerShell (Windows) y SIN comillas: con "cmd" las comillas de un sh -c se
    # pierden en el camino y el comando llega roto al contenedor. Decodifica el SQL y se lo
    # manda por stdin (-i) al psql del contenedor.
    interpreter = ["powershell", "-NoProfile", "-NonInteractive", "-Command"]
    command     = "[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($env:INIT_SQL_B64)) | docker run --rm -i -e PGHOST -e PGUSER -e PGPASSWORD -e PGDATABASE -e PGSSLMODE postgres:16-alpine psql -v ON_ERROR_STOP=1"

    environment = {
      PGHOST       = neon_project.preprod.database_host
      PGUSER       = neon_role.preprod.name
      PGPASSWORD   = neon_role.preprod.password
      PGDATABASE   = neon_database.preprod.name
      PGSSLMODE    = "require"
      INIT_SQL_B64 = filebase64("${path.module}/../backend/db/init.sql")
    }
  }
}
