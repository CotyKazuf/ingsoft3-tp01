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
