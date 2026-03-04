# ─── S3 Bucket for Songs & Thumbnails ────────────────────────────

resource "aws_s3_bucket" "songs" {
  bucket        = "listenme-songs-${local.account_id}"
  force_destroy = false
  tags          = { Name = "listenme-songs" }
}

resource "aws_s3_bucket_versioning" "songs" {
  bucket = aws_s3_bucket.songs.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "songs" {
  bucket = aws_s3_bucket.songs.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_public_access_block" "songs" {
  bucket                  = aws_s3_bucket.songs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "songs" {
  bucket = aws_s3_bucket.songs.id
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}
