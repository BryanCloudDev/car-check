#!/usr/bin/env bash
# Actualiza la policy de terraform-ci en AWS con la versión en este repo.
# Uso: ./update-iam-policy.sh
set -euo pipefail

POLICY_ARN="arn:aws:iam::692859931728:policy/terraform-ci-policy"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

aws iam create-policy-version \
  --policy-arn "$POLICY_ARN" \
  --policy-document "file://$SCRIPT_DIR/terraform-iam-policy.json" \
  --set-as-default

echo "Policy actualizada correctamente."
