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

variable "image_tag" {
  description = "Etiqueta (tag) de las imagenes de GHCR que corre preprod: la MISMA para backend y frontend. Es la que verificaron QA y PROD en el TP7."
  type        = string
  # Estable del TP7 (commit 15cce3d, el que corre en PROD y tiene el release v7.0.0).
  # No es un secreto. Se puede cambiar con -var o TF_VAR_image_tag sin tocar el codigo.
  default = "sha-15cce3dbf1ec4d43f6a9f9d32c5a3ac5635cb050"

  validation {
    condition     = can(regex("^sha-[0-9a-f]{40}$", var.image_tag))
    error_message = "image_tag debe tener la forma sha-<commit completo de 40 caracteres>. No se usa latest."
  }
}

variable "render_region" {
  description = "Region de Render de los dos servicios de preprod."
  type        = string
  # Virginia (us-east-1) para quedar en la misma zona que la base de preprod en Neon.
  default = "virginia"

  validation {
    condition     = contains(["frankfurt", "ohio", "oregon", "singapore", "virginia"], var.render_region)
    error_message = "render_region debe ser frankfurt, ohio, oregon, singapore o virginia."
  }
}
