resource "random_password" "master" {
  length = 24
  # Avoid characters that break Postgres connection URLs (@ : / ? # [ ] space)
  special          = true
  override_special = "!*-_=+."
}

resource "aws_rds_cluster_parameter_group" "this" {
  name        = "${var.name_prefix}-aurora-pg"
  family      = var.parameter_group_family
  description = "Cluster parameter group for ${var.name_prefix} Aurora PostgreSQL"

  parameter {
    name  = "rds.force_ssl"
    value = var.force_ssl ? "1" : "0"
  }
}

resource "aws_rds_cluster" "this" {
  cluster_identifier = "${var.name_prefix}-aurora"
  engine             = "aurora-postgresql"
  engine_mode        = "provisioned"
  engine_version     = var.engine_version

  database_name   = var.database_name
  master_username = var.master_username
  master_password = random_password.master.result

  db_subnet_group_name            = aws_db_subnet_group.this.name
  vpc_security_group_ids          = [aws_security_group.db.id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.this.name

  storage_encrypted       = true
  backup_retention_period = var.backup_retention_days
  deletion_protection     = var.deletion_protection
  skip_final_snapshot     = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.name_prefix}-aurora-final-${formatdate("YYYYMMDDhhmmss", timestamp())}"

  apply_immediately = true

  serverlessv2_scaling_configuration {
    min_capacity             = var.min_capacity
    max_capacity             = var.max_capacity
    seconds_until_auto_pause = var.min_capacity == 0 ? var.seconds_until_auto_pause : null
  }

  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}

resource "aws_rds_cluster_instance" "this" {
  identifier          = "${var.name_prefix}-aurora-1"
  cluster_identifier  = aws_rds_cluster.this.id
  instance_class      = "db.serverless"
  engine              = aws_rds_cluster.this.engine
  engine_version      = aws_rds_cluster.this.engine_version
  db_subnet_group_name = aws_db_subnet_group.this.name
  publicly_accessible = true
}

resource "aws_secretsmanager_secret" "db" {
  name        = "${var.name_prefix}/aurora/master"
  description = "Master credentials + connection string for ${var.name_prefix} Aurora"
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.master.result
    host     = aws_rds_cluster.this.endpoint
    port     = 5432
    dbname   = var.database_name
    # No sslmode here: the app controls TLS via DATABASE_SSL / DATABASE_SSL_CA.
    # A `sslmode` query param would override the app's ssl config in pg-connection-string.
    url = "postgres://${var.master_username}:${random_password.master.result}@${aws_rds_cluster.this.endpoint}:5432/${var.database_name}"
  })
}
