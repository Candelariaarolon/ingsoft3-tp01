terraform {
  required_version = ">= 1.5"

  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "0.18.0" # fijada: el repo del provider está archivado y el oficial todavía no existe
    }
    render = {
      source  = "render-oss/render"
      version = "1.9.1"
    }
  }
}

provider "neon" {}   # lee NEON_API_KEY
provider "render" {} # lee RENDER_API_KEY y RENDER_OWNER_ID

# --- El proyecto de Neon de PREPROD: no existe hasta que esto se aplica ---

resource "neon_project" "preprod" {
  name   = "curatta-preprod"
  org_id = var.neon_org_id

  # El provider pide 86400 s (un día) de historial y el tope del plan gratuito es 21600.
  history_retention_seconds = 21600
}

resource "neon_role" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id
  name       = "app_preprod_owner"
}

resource "neon_database" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id
  name       = "app_preprod"
  owner_name = neon_role.preprod.name
}

# --- Los dos servicios de Render de PREPROD ---

locals {
  # La cadena de conexión se ARMA acá, con lo que devolvió Neon. Nadie la copia y pega:
  # ése era el error más caro del TP6 (un entorno apuntando a la base de otro).
  # Prisma la lee como URI de Postgres en DATABASE_URL.
  conn = "postgresql://${neon_role.preprod.name}:${neon_role.preprod.password}@${neon_project.preprod.database_host}/${neon_database.preprod.name}?sslmode=require"
}

resource "render_web_service" "api" {
  name   = "curatta-api-preprod"
  plan   = "free"
  region = var.region

  runtime_source = {
    image = {
      image_url = var.image_repo_api # SIN la etiqueta pegada
      tag       = var.image_tag      # la etiqueta va en su propio campo
    }
  }

  env_vars = {
    DATABASE_URL = { value = local.conn }
    JWT_SECRET   = { value = var.jwt_secret }
  }
}

resource "render_web_service" "front" {
  name   = "curatta-front-preprod"
  plan   = "free"
  region = var.region

  runtime_source = {
    image = {
      image_url = var.image_repo_front
      tag       = var.image_tag
    }
  }

  env_vars = {
    BACKEND_URL = { value = render_web_service.api.url } # la URL sale de Terraform, no de un copy-paste
    JWT_SECRET  = { value = var.jwt_secret }
  }
}
