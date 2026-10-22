# TP8 - Infraestructura como Codigo: quien habla con quien.
# Este archivo solo FIJA las herramientas. Todavia no declara ningun recurso.
#
# Las versiones de los providers son EXACTAS (sin ~> ni >=) a proposito: son las que la
# catedra probo contra cuentas reales. Subirlas es una decision que se discute y se anota,
# no algo que ocurre solo con "terraform init".

terraform {
  required_version = ">= 1.5"

  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "0.18.0"
    }
    render = {
      source  = "render-oss/render"
      version = "1.9.1"
    }
  }
}

# Sin bloques "provider": las credenciales (NEON_API_KEY, RENDER_API_KEY y RENDER_OWNER_ID)
# las leen los providers desde variables de entorno de tu terminal. Nunca se escriben aca.
