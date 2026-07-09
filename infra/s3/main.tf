terraform {
  required_version = ">= 1.6"

  cloud {
    organization = "org-U85qUAssM86xo1sz"
    workspaces {
      tags = ["car-check-s3"]
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ------------------------------------------------------------
# Sufijo único para evitar conflictos de nombre de bucket
# ------------------------------------------------------------
resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  bucket_name = "${var.project}-media-${var.env}-${random_id.suffix.hex}"
}

# ------------------------------------------------------------
# Bucket S3 — privado
# ------------------------------------------------------------
resource "aws_s3_bucket" "media" {
  bucket        = local.bucket_name
  force_destroy = var.env != "prod"

  tags = {
    Project     = var.project
    Environment = var.env
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ------------------------------------------------------------
# CORS — subida directa desde el navegador vía presigned URLs
# ------------------------------------------------------------
resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_methods = ["PUT", "GET"]
    allowed_origins = var.allowed_origins
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# ------------------------------------------------------------
# Cifrado en reposo (SSE-S3 por defecto)
# ------------------------------------------------------------
resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ------------------------------------------------------------
# IAM — usuario de servicio con permisos mínimos
# ------------------------------------------------------------
resource "aws_iam_user" "s3_service" {
  name = "${var.project}-s3-${var.env}"
  path = "/service/"

  tags = {
    Project     = var.project
    Environment = var.env
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_access_key" "s3_service" {
  user = aws_iam_user.s3_service.name
}

data "aws_iam_policy_document" "s3_minimal" {
  statement {
    sid    = "AllowPresignedOps"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
    ]
    resources = ["${aws_s3_bucket.media.arn}/*"]
  }
}

resource "aws_iam_user_policy" "s3_service" {
  name   = "${var.project}-s3-policy-${var.env}"
  user   = aws_iam_user.s3_service.name
  policy = data.aws_iam_policy_document.s3_minimal.json
}
