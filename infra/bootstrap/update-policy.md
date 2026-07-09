# Actualizar policy de terraform-ci

Ejecuta el script (requiere AWS CLI con permisos de IAM admin):

```bash
./infra/bootstrap/update-iam-policy.sh
```

O el one-liner equivalente:

```bash
aws iam create-policy-version \
  --policy-arn arn:aws:iam::692859931728:policy/terraform-ci-policy \
  --policy-document file://infra/bootstrap/terraform-iam-policy.json \
  --set-as-default
```
