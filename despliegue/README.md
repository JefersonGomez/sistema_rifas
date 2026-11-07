# Despliegue en el VPS (sin Docker)

La app corre directo con Node, la mantiene viva **systemd** y **Caddy** pone el HTTPS.
La base de datos queda en Neon.

```
Celular ──HTTPS──► Caddy (443) ──► Node 127.0.0.1:3000 (API + página) ──► Neon
```

Probado para **Ubuntu 24.04**. Todo se hace por SSH en el VPS.
Donde dice `rifasivannia`, use el subdominio que registre en DuckDNS.

---

## 1. Subdominio gratis en DuckDNS

1. Entre a <https://www.duckdns.org> con su cuenta de Google o GitHub.
2. Escriba `rifasivannia` y toque **add domain**.
3. En **current ip** ponga la IP pública del VPS y toque **update ip**.

Si la IP del VPS es fija, no hay que hacer nada más.

## 2. Preparar el VPS (una sola vez)

```bash
# Paquetes base y firewall: solo SSH, HTTP y HTTPS
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ufw ca-certificates gnupg
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw --force enable

# Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Caddy (HTTPS automático)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy

# pg_dump 18 para los respaldos (Neon usa PostgreSQL 18)
sudo install -d /usr/share/postgresql-common/pgdg
sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc
echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(. /etc/os-release && echo $VERSION_CODENAME)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
sudo apt update && sudo apt install -y postgresql-client-18
```

## 3. Usuario y código de la app

```bash
# Usuario propio para la app (sin contraseña, no puede entrar por SSH)
sudo adduser --system --group --home /home/rifas --shell /bin/bash rifas
sudo mkdir /opt/rifas && sudo chown rifas:rifas /opt/rifas
sudo -u rifas git clone https://github.com/JefersonGomez/sistema_rifas.git /opt/rifas

# Permitir que "rifas" reinicie su servicio (lo usa actualizar.sh)
echo 'rifas ALL=NOPASSWD: /usr/bin/systemctl restart rifas' | sudo tee /etc/sudoers.d/rifas
sudo chmod 440 /etc/sudoers.d/rifas
```

## 4. Variables de entorno

```bash
sudo -u rifas cp /opt/rifas/api/.env.example /opt/rifas/api/.env
sudo -u rifas nano /opt/rifas/api/.env
sudo chmod 600 /opt/rifas/api/.env
```

Llene así (las dos URL se copian de Neon → **Connect**, rama principal):

```env
DATABASE_URL="postgresql://…-pooler…/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://…(sin -pooler)…/neondb?sslmode=require&channel_binding=require"
PORT=3000
TZ=America/Costa_Rica
SESSION_SECRET="(texto nuevo, ver abajo)"
UPLOAD_DIR=uploads
NODE_ENV=production
HOST=127.0.0.1
TRUST_PROXY=1
APP_URL=https://rifasivannia.duckdns.org
```

`APP_URL` es la dirección pública: con ella WhatsApp arma la miniatura (foto, título y precio) al compartir el enlace.

Para el `SESSION_SECRET` genere uno **nuevo** (no use el de la compu):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## 5. Instalar, compilar y crear el usuario de mamá

```bash
cd /opt/rifas
sudo -u rifas npm ci
sudo -u rifas npm run build
sudo -u rifas npm run db:deploy -w api
sudo -u rifas mkdir -p api/uploads
sudo -u rifas npm run crear-admin -w api
```

## 6. Dejar la app corriendo siempre

```bash
sudo cp /opt/rifas/despliegue/rifas.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now rifas
curl http://127.0.0.1:3000/api/health     # debe decir "conectada"
```

## 7. HTTPS con Caddy

Si usó otro subdominio, cámbielo primero en `despliegue/Caddyfile`.

```bash
sudo cp /opt/rifas/despliegue/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

En uno o dos minutos <https://rifasivannia.duckdns.org> abre con candado.
Pruébelo **con datos móviles** (sin Wi-Fi) desde el celular.

## 8. Respaldos diarios

```bash
sudo mkdir -p /var/backups/rifas && sudo chown rifas:rifas /var/backups/rifas
sudo -u rifas /opt/rifas/despliegue/respaldo.sh        # prueba manual
sudo -u rifas crontab -e
```

Agregue esta línea (todos los días a las 3:00 a. m.):

```
0 3 * * * /opt/rifas/despliegue/respaldo.sh >> /var/backups/rifas/respaldo.log 2>&1
```

Quedan los últimos 14 días de la base (`base-AAAA-MM-DD.sql.gz`) y de las fotos (`fotos-…tar.gz`).

**Restaurar** (solo si algo se perdió): `gunzip -c base-AAAA-MM-DD.sql.gz | psql "$DIRECT_URL"` sobre una base vacía o una rama nueva de Neon.

## 9. Instalar la app en el celular de mamá

Abra <https://rifasivannia.duckdns.org/admin> en el celular:

- **Android (Chrome):** menú ⋮ → **Agregar a la pantalla principal** / **Instalar app**.
- **iPhone (Safari):** botón Compartir → **Agregar a inicio**.

Queda el ícono de la tómbola y abre directo en el panel.

## Actualizar a una versión nueva

Después de cada `git push`:

```bash
sudo -u rifas /opt/rifas/despliegue/actualizar.sh
```

## Si algo falla

| Qué pasa | Qué revisar |
| --- | --- |
| La página no abre | `sudo systemctl status rifas caddy` |
| Error de la app | `sudo journalctl -u rifas -n 50` |
| No sale el candado HTTPS | Que DuckDNS tenga la IP correcta y los puertos 80/443 abiertos: `sudo journalctl -u caddy -n 50` |
| "Base de datos: sin conexión" | Las URL de Neon en `api/.env` |
| Mamá olvidó la contraseña | `cd /opt/rifas && sudo -u rifas npm run crear-admin -w api` (mismo usuario, clave nueva) |

## Antes de usarla de verdad: base limpia

La rama principal de Neon tiene **datos de prueba**. Cuando exista la rama `desarrollo` para la compu,
vacíe la principal desde el **SQL Editor** de Neon (rama principal) con:

```sql
TRUNCATE pagos, recordatorios, boletos, clientes, rifas RESTART IDENTITY;
```

Esto borra rifas, clientes y pagos, pero deja los usuarios del panel. No se puede deshacer.
