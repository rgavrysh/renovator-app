# Aurora PostgreSQL Serverless v2 (scale-to-zero)

Terraform stack that provisions an **Aurora PostgreSQL Serverless v2** cluster for the
Renovator Portal operational data, sized for rare usage (≤ 3 users, cold starts tolerated).

## What it creates

- Dedicated VPC (`10.20.0.0/16`) with 2 public subnets across 2 AZs, an internet gateway,
  and a public route table (Aurora needs ≥ 2 AZs; public so the Render backend can reach it).
- Security group allowing TCP `5432` only from the configured CIDRs
  (Render egress `74.220.48.0/24`, `74.220.56.0/24`, and admin IP `195.160.232.110/32`).
- Aurora PostgreSQL cluster + one `db.serverless` instance:
  - **Scale-to-zero**: `min_capacity = 0`, `max_capacity = 4`, auto-pause after 5 min idle.
  - Storage encrypted, 7-day backups, `rds.force_ssl = 1` (TLS required).
  - `publicly_accessible = true`.
- Secrets Manager secret with the master credentials + connection URL.

## Cost model

While **paused** (no connections) you pay storage only (~$0.10/GB-month). When the backend
or you connect, it resumes in ~15 s and bills compute at ~$0.12/ACU-hr for the seconds it is
awake, scaling up to 4 ACU under load. No RDS Proxy is provisioned.

> Note: the cluster stays awake as long as a client holds a connection. Your Render backend
> also scales to zero when idle, so it will drop its TypeORM pool and let Aurora pause.

## Prerequisites

- Terraform >= 1.6, AWS provider >= 5.83 (required for `seconds_until_auto_pause`).
- AWS credentials with rights to create VPC/RDS/Secrets Manager resources
  (e.g. `export AWS_PROFILE=...` and `export AWS_REGION=eu-central-1`).
- Verify the engine version is available in your region:
  ```bash
  aws rds describe-db-engine-versions \
    --engine aurora-postgresql \
    --query "DBEngineVersions[?EngineVersion>='16.3'].EngineVersion" --output table
  ```

## Deploy

```bash
cd infra/terraform/aurora
cp terraform.tfvars.example terraform.tfvars   # edit if needed
terraform init
terraform plan
terraform apply
```

Grab the connection details:

```bash
terraform output cluster_endpoint
terraform output -raw database_url        # full DATABASE_URL (sensitive)
terraform output -raw master_password     # password only
```

## Full-clone data migration

Your dumps are plain SQL (`pg_dump ... > renovator_YYYY-MM-DD.sql`), so restore with `psql`.
The first connection wakes the cluster (~15 s), which is expected.

```bash
# Endpoint + password from Terraform outputs
HOST=$(terraform output -raw cluster_endpoint)
export PGPASSWORD=$(terraform output -raw master_password)
PSQL=/opt/homebrew/opt/postgresql@18/bin/psql   # match your client to PG16+

# Load the full clone (schema + data + the TypeORM `migrations` table)
"$PSQL" "host=$HOST port=5432 dbname=renovator user=renovator sslmode=require" \
  -f renovator_2026-03-05.sql

# Verify row counts
"$PSQL" "host=$HOST port=5432 dbname=renovator user=renovator sslmode=require" \
  -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;"
```

Because the dump includes the `migrations` table, TypeORM's `initializeDatabase()` will report
"No pending migrations" on the next backend boot instead of re-running them.

## Point the backend at Aurora

In the Render dashboard for `renovator-backend`, set:

- `DATABASE_URL` = the `database_url` output value — **no `?sslmode=...` query param**
- `DATABASE_SSL` = `true`

TLS is configured in the app code (`packages/backend/src/config/database.ts`), not via the URL.
Do **not** append `?sslmode=require` to `DATABASE_URL`: pg-connection-string parses that param and
overrides the app's `ssl` config, which turns on cert verification and fails with
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY` (Node doesn't ship the Amazon RDS CA).

### Optional: verify the Aurora certificate (recommended for a public endpoint)

By default the app encrypts without verifying the server cert (`rejectUnauthorized: false`).
To verify against Amazon's CA instead, download the RDS global bundle and point the app at it:

```bash
# commit the bundle with the backend or bake it into the image
curl -o packages/backend/certs/rds-global-bundle.pem \
  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

Then set on Render either:

- `DATABASE_SSL_CA=/opt/render/project/src/packages/backend/certs/rds-global-bundle.pem` (path), or
- `DATABASE_SSL_CA_CERT="<full PEM contents>"` (inline)

The app then connects with `{ ca, rejectUnauthorized: true }`.

## Teardown

```bash
terraform destroy
```

Set `skip_final_snapshot = false` first if you want a final snapshot, and
`deletion_protection = false` (default) so destroy is not blocked.
