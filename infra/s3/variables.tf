variable "aws_region" {
  description = "AWS region where the bucket will be created"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project slug used as name prefix for all resources"
  type        = string
  default     = "car-check"
}

variable "env" {
  description = "Deployment environment (dev | qa | prod)"
  type        = string

  validation {
    condition     = contains(["dev", "qa", "prod"], var.env)
    error_message = "env must be one of: dev, qa, prod"
  }
}

variable "allowed_origins" {
  description = "Origins allowed in CORS rules (presigned upload from browser)"
  type        = list(string)
  default     = ["http://localhost:3000"]
}
