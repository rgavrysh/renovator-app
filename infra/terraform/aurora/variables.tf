variable "aws_region" {
  description = "AWS region to deploy the Aurora cluster into."
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Environment name used for tagging and resource naming."
  type        = string
  default     = "production"
}

variable "name_prefix" {
  description = "Prefix applied to all resource names."
  type        = string
  default     = "renovator"
}

variable "vpc_cidr" {
  description = "CIDR block for the dedicated VPC hosting the database."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs (need >= 2 in different AZs for the DB subnet group). The DB is publicly reachable so the backend on Render can connect."
  type        = list(string)
  default     = ["10.20.0.0/24", "10.20.1.0/24"]
}

variable "allowed_cidrs" {
  description = "CIDR ranges allowed to reach Postgres (5432). Render egress ranges + your admin IP."
  type        = list(string)
  default = [
    "74.220.48.0/24",  # Render backend egress
    "74.220.56.0/24",  # Render backend egress
    "195.160.232.110/32" # admin IP (local login/config)
  ]
}

variable "engine_version" {
  description = "Aurora PostgreSQL engine version. Must be >= 16.3 (or 15.7 / 14.12 / 13.15) to support scale-to-zero auto-pause."
  type        = string
  default     = "16.6"
}

variable "parameter_group_family" {
  description = "DB parameter group family matching the engine major version."
  type        = string
  default     = "aurora-postgresql16"
}

variable "database_name" {
  description = "Initial database name created on the cluster."
  type        = string
  default     = "renovator"
}

variable "master_username" {
  description = "Master (admin) username for the cluster."
  type        = string
  default     = "renovator"
}

variable "min_capacity" {
  description = "Minimum Aurora Capacity Units. 0 enables scale-to-zero (auto-pause) — compute billing stops while paused, storage still billed."
  type        = number
  default     = 0
}

variable "max_capacity" {
  description = "Maximum Aurora Capacity Units the cluster can scale up to."
  type        = number
  default     = 4
}

variable "seconds_until_auto_pause" {
  description = "Idle seconds (no connections) before the cluster auto-pauses when min_capacity = 0. Range 300 (5 min) to 86400 (24 h)."
  type        = number
  default     = 300
}

variable "backup_retention_days" {
  description = "Number of days to retain automated backups."
  type        = number
  default     = 7
}

variable "deletion_protection" {
  description = "Prevent accidental cluster deletion. Recommended true for production."
  type        = bool
  default     = false
}

variable "skip_final_snapshot" {
  description = "Skip the final snapshot on destroy. Set false for production teardowns."
  type        = bool
  default     = true
}

variable "force_ssl" {
  description = "Require TLS for all client connections (rds.force_ssl). Recommended since the endpoint is public."
  type        = bool
  default     = true
}
