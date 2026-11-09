# Despliegue en el VPS (sin Docker)

La app corre directo con Node y la mantiene viva **systemd**. El **Nginx** que ya tiene el VPS
(compartido con portafolio, stockly y techrag) la publica, y **certbot** pone el HTTPS. La base de datos queda en Neon.

```
Celular ──HTTPS──► Nginx (443) ──► Node 127.0.0.1:3100 (API + página) ──► Neon
```

VPS de Contabo con **Ubuntu 24.04**, Node 22, Nginx, certbot y Docker ya instalados. Todo se hace por SSH.
No se toca nada de los otros proyectos: solo se agrega un sitio nuevo a Nginx.
Donde dice `rifasivannia`, use el subdominio que registre en DuckDNS.

---

## 1. Subdominio gratis en DuckDNS

1. Entre a <https://www.duckdns.org> con su cuenta de Google o GitHub.
2. Escriba `rifasivannia` y toque **add domain**.
3. En **current ip** ponga la IP pública del VPS (`169.58.105.198`) y toque **update ip**.

Si la IP del VPS es fija, no hay que hacer nada más.

## 2. Preparar el VPS (una sola vez)

Node 22, Nginx, certbot y el firewall (22, 80, 443) ya están. Solo falta **pg_dump 18** para los respaldos
(Neon usa PostgreSQL 18; no instala ninguna base de datos, solo la herramienta):

```bash
node -v    # debe decir v22.x
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
PORT=3100
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
curl http://127.0.0.1:3100/api/health     # debe decir "conectada"
```

## 7. Publicar en Nginx con HTTPS

Antes, revise que DuckDNS ya apunte al VPS: `ping -c1 rifasivannia.duckdns.org` debe mostrar `169.58.105.198`.

```bash
sudo cp /opt/rifas/despliegue/nginx-rifas.conf /etc/nginx/sites-available/rifas
sudo ln -s /etc/nginx/sites-available/rifas /etc/nginx/sites-enabled/rifas
sudo nginx -t                      # debe decir "syntax is ok" y "test is successful"
sudo systemctl reload nginx        # reload: los otros sitios siguen sin cortes
sudo certbot --nginx -d rifasivannia.duckdns.org
```

Si `nginx -t` da error, **no** recargue: borre el enlace (`sudo rm /etc/nginx/sites-enabled/rifas`) y avise.
certbot pide un correo la primera vez y agrega solo el HTTPS y la redirección de http a https; se renueva solo.

En uno o dos minutos <https://rifasivannia.duckdns.org> abre con candado.
Pruébelo **con datos móviles** (sin Wi-Fi) desde el celular.

## 8. Respaldos diarios

```bash
sudo mkdir -p /var/backups/rifas && sudo chown rifas:rifas /var/backups/rifas
sudo -u rifas /opt/rifas/despliegue/respaldo.sh        # prueba manual
sudo -u rifas crontab -e
```

Agregue esta línea (todos los días a las 3:00 a. m. de Costa Rica; el VPS usa hora UTC, por eso dice 9):

```
0 9 * * * /opt/rifas/despliegue/respaldo.sh >> /var/backups/rifas/respaldo.log 2>&1
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
| La página no abre | `sudo systemctl status rifas nginx` |
| Error de la app | `sudo journalctl -u rifas -n 50` |
| No sale el candado HTTPS | Que DuckDNS tenga la IP correcta y volver a correr `sudo certbot --nginx -d rifasivannia.duckdns.org` |
| Error 502 en la página | La app no está corriendo: `sudo systemctl restart rifas` y `sudo journalctl -u rifas -n 50` |
| "Base de datos: sin conexión" | Las URL de Neon en `api/.env` |
| Mamá olvidó la contraseña | `cd /opt/rifas && sudo -u rifas npm run crear-admin -w api` (mismo usuario, clave nueva) |

## Antes de usarla de verdad: base limpia

La rama principal de Neon tiene **datos de prueba**. Cuando exista la rama `desarrollo` para la compu,
vacíe la principal desde el **SQL Editor** de Neon (rama principal) con:

```sql
TRUNCATE pagos, recordatorios, boletos, clientes, premios, rifas RESTART IDENTITY;
```

Esto borra rifas, clientes y pagos, pero deja los usuarios del panel. No se puede deshacer.
