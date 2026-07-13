terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source = "hashicorp/aws"
      # seconds_until_auto_pause (scale-to-zero auto-pause) requires >= 5.83.0
      version = ">= 5.83.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "renovator-portal"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
