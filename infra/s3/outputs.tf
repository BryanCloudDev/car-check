output "bucket_name" {
  description = "S3 bucket name — set as S3_BUCKET env var"
  value       = aws_s3_bucket.media.id
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.media.arn
}

output "aws_region" {
  description = "AWS region — set as AWS_REGION env var"
  value       = var.aws_region
}

output "iam_access_key_id" {
  description = "IAM access key ID — set as AWS_ACCESS_KEY_ID env var"
  value       = aws_iam_access_key.s3_service.id
}

output "iam_secret_access_key" {
  description = "IAM secret access key — set as AWS_SECRET_ACCESS_KEY env var (sensitive)"
  value       = aws_iam_access_key.s3_service.secret
  sensitive   = true
}
