# ============================================================================
# Backend Configuration for Development Environment
# ============================================================================
# Este archivo configura dónde se almacena el state de Terraform para dev.
#
# Uso:
#   terraform init -backend-config=environments/dev/backend.hcl
# ============================================================================

bucket         = "nodejs-api-terraform-state-192606546527"
key            = "dev/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "terraform-state-lock"
encrypt        = true

# Configuración adicional
skip_region_validation      = false
skip_credentials_validation = false
skip_metadata_api_check     = false
