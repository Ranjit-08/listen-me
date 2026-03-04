# ─────────────────────────────────────────────────────────────────
# terraform.tfvars  —  Fill in your values, then run terraform apply
# This file is in .gitignore — it will NEVER be pushed to GitHub
# ─────────────────────────────────────────────────────────────────

aws_region         = "us-east-1"
node_instance_type = "t3.medium"
node_min           = 1
node_max           = 3
node_desired       = 2
db_instance_class  = "db.t3.micro"
db_username        = "admin"
db_password        = "Ranjit-123"
