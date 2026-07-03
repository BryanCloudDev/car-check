#!/usr/bin/env bash
# Usage: ./infra/scripts/provision.sh <dev|qa|prod>
#
# Requires:
#   - terraform >= 1.6
#   - aws CLI configured with: aws configure --profile car-check
#   - railway CLI installed and logged in: railway login && railway link
set -euo pipefail

ENV="${1:?Usage: $0 <dev|qa|prod>}"

if [[ ! "$ENV" =~ ^(dev|qa|prod)$ ]]; then
  echo "Error: ENV must be one of: dev, qa, prod"
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
INFRA_DIR="$REPO_ROOT/infra/s3"

echo "==> Provisioning S3 infrastructure for: $ENV"
cd "$INFRA_DIR"

# Select or create workspace
if AWS_PROFILE=car-check terraform workspace list 2>/dev/null | grep -qE "^\*?\s+${ENV}$"; then
  AWS_PROFILE=car-check terraform workspace select "$ENV"
else
  AWS_PROFILE=car-check terraform workspace new "$ENV"
fi

# Apply — prod requires manual confirmation, dev/qa auto-approve
if [[ "$ENV" == "prod" ]]; then
  AWS_PROFILE=car-check terraform apply -var-file="envs/${ENV}.tfvars"
else
  AWS_PROFILE=car-check terraform apply -var-file="envs/${ENV}.tfvars" -auto-approve
fi

# Read outputs
BUCKET=$(AWS_PROFILE=car-check terraform output -raw bucket_name)
REGION=$(AWS_PROFILE=car-check terraform output -raw aws_region)
KEY_ID=$(AWS_PROFILE=car-check terraform output -raw iam_access_key_id)
SECRET=$(AWS_PROFILE=car-check terraform output -raw iam_secret_access_key)

echo ""
echo "==> Bucket created: $BUCKET"
echo "==> Pushing variables to Railway environment: $ENV"

railway variables set \
  APP_ENV="$ENV" \
  AWS_REGION="$REGION" \
  S3_BUCKET="$BUCKET" \
  AWS_ACCESS_KEY_ID="$KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$SECRET" \
  --environment "$ENV"

echo ""
echo "==> Done. Railway $ENV environment is ready."
