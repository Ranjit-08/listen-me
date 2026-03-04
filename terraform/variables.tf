variable "aws_region" {
  type        = string
  description = "AWS region where resources will be deployed"
  default     = "us-east-1"
}

variable "eks_version" {
  type        = string
  description = "EKS Kubernetes version"
  default     = "1.29"
}

variable "node_instance_type" {
  type        = string
  description = "Instance type for EKS worker nodes"
  default     = "t3.medium"
}

variable "node_min" {
  type        = number
  description = "Minimum number of nodes"
  default     = 1
}

variable "node_max" {
  type        = number
  description = "Maximum number of nodes"
  default     = 3
}

variable "node_desired" {
  type        = number
  description = "Desired number of nodes"
  default     = 2
}

variable "db_instance_class" {
  type        = string
  description = "RDS instance type"
  default     = "db.t3.micro"
}

variable "db_username" {
  type        = string
  description = "Database admin username"
  default     = "admin"
}

variable "db_password" {
  type        = string
  description = "Database admin password"
  sensitive   = true
}