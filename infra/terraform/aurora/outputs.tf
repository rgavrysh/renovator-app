output "cluster_endpoint" {
  description = "Writer endpoint for the Aurora cluster."
  value       = aws_rds_cluster.this.endpoint
}

output "reader_endpoint" {
  description = "Reader endpoint for the Aurora cluster."
  value       = aws_rds_cluster.this.reader_endpoint
}

output "port" {
  description = "Database port."
  value       = 5432
}

output "database_name" {
  description = "Initial database name."
  value       = var.database_name
}

output "master_username" {
  description = "Master username."
  value       = var.master_username
}

output "secret_arn" {
  description = "Secrets Manager ARN holding the master credentials and connection URL."
  value       = aws_secretsmanager_secret.db.arn
}

output "master_password" {
  description = "Master password (sensitive). Retrieve with: terraform output -raw master_password"
  value       = random_password.master.result
  sensitive   = true
}

output "database_url" {
  description = "Full connection string for DATABASE_URL (sensitive). TLS is controlled by the app via DATABASE_SSL, not a sslmode query param."
  value       = "postgres://${var.master_username}:${random_password.master.result}@${aws_rds_cluster.this.endpoint}:5432/${var.database_name}"
  sensitive   = true
}
