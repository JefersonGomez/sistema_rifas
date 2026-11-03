#!/usr/bin/env bash
# Respaldo diario de la base de datos (pg_dump) y de las fotos. Guarda los últimos 14 días.
# Cron (como usuario rifas, todos los días a las 3:00 a. m.):
#   0 3 * * * /opt/rifas/despliegue/respaldo.sh >> /var/backups/rifas/respaldo.log 2>&1
set -euo pipefail

APP="$(cd "$(dirname "$0")/.." && pwd)"
DESTINO="${DESTINO:-/var/backups/rifas}"
DIAS=14
FECHA="$(date +%F)"
mkdir -p "$DESTINO"

# Usa la conexión directa (sin pooler), que es la que pg_dump necesita.
DIRECT_URL="$(grep -E '^DIRECT_URL=' "$APP/api/.env" | cut -d= -f2- | tr -d '"')"
if [ -z "$DIRECT_URL" ]; then
  echo "$(date '+%F %T') ✘ Falta DIRECT_URL en api/.env" >&2
  exit 1
fi

pg_dump --no-owner --no-privileges "$DIRECT_URL" | gzip > "$DESTINO/base-$FECHA.sql.gz"
tar -czf "$DESTINO/fotos-$FECHA.tar.gz" -C "$APP/api" uploads

# Borra los respaldos de más de 14 días.
find "$DESTINO" -name '*.gz' -mtime +"$DIAS" -delete

echo "$(date '+%F %T') ✔ Respaldo listo: base-$FECHA.sql.gz y fotos-$FECHA.tar.gz"
