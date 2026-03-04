# ─── Security Group for RDS ───────────────────────────────────────

resource "aws_security_group" "rds" {
  name        = "listenme-rds-sg"
  description = "Allow MySQL from EKS nodes only"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "listenme-rds-sg"
  }
}

# ─── RDS Subnet Group ─────────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name = "listenme-db-subnet-group"

  subnet_ids = [
    aws_subnet.private_a.id,
    aws_subnet.private_b.id
  ]

  tags = {
    Name = "listenme-db-subnet-group"
  }
}

# ─── RDS MySQL Instance ───────────────────────────────────────────

resource "aws_db_instance" "main" {
  identifier = "listenme-mysql"

  engine         = "mysql"
  engine_version = "8.0"

  instance_class = var.db_instance_class

  db_name  = "listenme"
  username = var.db_username
  password = var.db_password

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  publicly_accessible = false
  multi_az            = false

  backup_retention_period = 7

  deletion_protection = false
  skip_final_snapshot = true

  tags = {
    Name = "listenme-mysql"
  }
}