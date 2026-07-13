resource "aws_security_group" "db" {
  name        = "${var.name_prefix}-aurora-sg"
  description = "Allow Postgres access from Render egress ranges and admin IP"
  vpc_id      = aws_vpc.this.id

  tags = {
    Name = "${var.name_prefix}-aurora-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "postgres" {
  for_each = toset(var.allowed_cidrs)

  security_group_id = aws_security_group.db.id
  description       = "Postgres from ${each.value}"
  cidr_ipv4         = each.value
  from_port         = 5432
  to_port           = 5432
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.db.id
  description       = "Allow all outbound"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}
