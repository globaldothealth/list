# provider.tf

# Specify the provider and access details
provider "aws" {
  profile = "default"
  region  = var.region
}
