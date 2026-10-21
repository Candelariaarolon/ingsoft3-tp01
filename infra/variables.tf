variable "neon_org_id" { default = "org-still-base-46863067" } # mi cuenta de Neon vive en una organización: sin esto, crear el proyecto da 400

variable "image_repo_api" { default = "ghcr.io/candelariaarolon/ingsoft3-tp01-backend" }    # SIN la etiqueta
variable "image_repo_front" { default = "ghcr.io/candelariaarolon/ingsoft3-tp01-frontend" } # SIN la etiqueta
variable "image_tag" { default = "sha-03b2c3f022dd31cc2202fdb3f03b76009d833724" }           # el merge de la v7.0.0
variable "region" { default = "ohio" }                                                      # la misma de QA, PROD y la base

# El front firma y la api verifica la sesión con este secreto: los dos servicios tienen que tener el mismo.
# Es un secreto, así que no lleva default: el valor está en preprod.auto.tfvars, que el .gitignore ignora.
variable "jwt_secret" {
  type      = string
  sensitive = true
}
