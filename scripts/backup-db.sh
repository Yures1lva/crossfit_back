#!/usr/bin/env bash
# Backup completo do banco Postgres do Supabase (Fase 1 do plano de migração).
# Rodar de qualquer máquina com acesso à internet (não precisa ser na VPS).
#
# Uso:
#   DB_HOST=... DB_PORT=5432 DB_USER=postgres.xxxx DB_PASSWORD=... DB_NAME=postgres \
#     ./scripts/backup-db.sh
#
# Pegue essas variáveis em: Supabase Dashboard → Project Settings → Database → Connection string
# (prefira o "Transaction pooler" ou "Session pooler", porta 5432/6543 — ver nota no fim)

set -euo pipefail

: "${DB_HOST:?defina DB_HOST}"
: "${DB_PORT:?defina DB_PORT}"
: "${DB_USER:?defina DB_USER}"
: "${DB_PASSWORD:?defina DB_PASSWORD}"
: "${DB_NAME:?defina DB_NAME}"

OUT_DIR="$(dirname "$0")/../backups"
mkdir -p "$OUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="$OUT_DIR/crossfit_db_${TIMESTAMP}.dump"

export PGPASSWORD="$DB_PASSWORD"

echo "→ Rodando pg_dump de $DB_HOST:$DB_PORT/$DB_NAME ..."
pg_dump \
  --host="$DB_HOST" --port="$DB_PORT" \
  --username="$DB_USER" --dbname="$DB_NAME" \
  --no-owner --no-acl -F c -f "$FILE"

echo "✔ Backup criado: $FILE"
echo "  Tamanho: $(du -h "$FILE" | cut -f1)"
echo ""
echo "IMPORTANTE: copie esse arquivo pra fora desta máquina (Drive, S3, seu computador local)."
echo "Ele NÃO deve ficar só aqui — essa é a garantia contra perda de dado."

# Nota: se o pg_dump falhar com erro de "prepared statement" no pooler de transação,
# troque pra porta 5432 (Session pooler) em vez de 6543 (Transaction pooler).
