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
