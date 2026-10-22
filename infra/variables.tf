# Valores de entrada de la infraestructura de preprod.

variable "neon_org_id" {
  description = "Identificador de la organizacion de Neon donde se crea el proyecto de preprod (empieza con org-)."
  type        = string

  # Sin valor por defecto a proposito: Terraform lo toma de la variable de entorno
  # TF_VAR_neon_org_id. Asi no queda escrito en un archivo que se sube a un repositorio publico.
  validation {
    condition     = can(regex("^org-", var.neon_org_id))
    error_message = "neon_org_id debe ser el identificador de la organizacion de Neon: empieza con org-."
  }
}
