# Lo que Terraform muestra al terminar. Solo datos que NO son secretos.
# La contrasena y la cadena de conexion no se sacan por output: un output se imprime en la
# consola y en los logs. Mas adelante llegan al servicio de Render por referencia, sin pasar
# por ningun lugar visible.

output "db_host" {
  description = "Direccion del servidor de Postgres de preprod (la asigna Neon)."
  value       = neon_project.preprod.database_host
}

output "database" {
  description = "Nombre de la base de preprod."
  value       = neon_database.preprod.name
}

output "api_url" {
  description = "URL publica de la API de preprod (la asigna Render)."
  value       = render_web_service.api.url
}

output "front_url" {
  description = "URL publica del frontend de preprod (la asigna Render)."
  value       = render_web_service.front.url
}
