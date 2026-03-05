# ─── Copy these values into GitHub Secrets after terraform apply ──

output "ECR_BACKEND_URL" {
  value = aws_ecr_repository.backend.repository_url
}

output "ECR_FRONTEND_URL" {
  value = aws_ecr_repository.frontend.repository_url
}

output "EKS_CLUSTER_NAME" {
  value = aws_eks_cluster.main.name
}

output "S3_BUCKET" {
  value = aws_s3_bucket.songs.bucket
}

output "DB_HOST" {
  value     = aws_db_instance.main.address
  sensitive = true
}

output "ALB_CONTROLLER_ROLE_ARN" {
  value = aws_iam_role.alb_controller.arn
}

output "AWS_REGION" {
  value = var.aws_region
}
# ─── Add these to outputs.tf ─────────────────────────────────────

output "GITHUB_ACTIONS_ACCESS_KEY_ID" {
  value     = aws_iam_access_key.github_actions.id
  sensitive = true
}

output "GITHUB_ACTIONS_SECRET_ACCESS_KEY" {
  value     = aws_iam_access_key.github_actions.secret
  sensitive = true
}