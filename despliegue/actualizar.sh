#!/usr/bin/env bash
# Baja la última versión de GitHub, compila, aplica migraciones y reinicia la app.
# Uso en el VPS (como usuario rifas):  ./despliegue/actualizar.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# Puerto de la app (PORT en api/.env).
PUERTO=$(grep -E '^PORT=' api/.env | cut -d= -f2 | tr -d '"' || true)
PUERTO=${PUERTO:-3000}

echo "→ Bajando cambios de GitHub…"
git pull --ff-only

echo "→ Instalando dependencias…"
npm ci --no-audit --no-fund

echo "→ Compilando la página…"
npm run build

echo "→ Aplicando cambios a la base de datos…"
npm run db:deploy -w api

echo "→ Reiniciando la app…"
sudo systemctl restart rifas

# Espera a que la app conteste antes de dar el visto bueno.
for _ in $(seq 1 15); do
  if curl -fsS http://127.0.0.1:${PUERTO}/api/health >/dev/null 2>&1; then
    echo "✔ Rifas Ivannia actualizada y funcionando."
    exit 0
  fi
  sleep 1
done
echo "✘ La app no responde. Revise con: sudo journalctl -u rifas -n 50" >&2
exit 1
