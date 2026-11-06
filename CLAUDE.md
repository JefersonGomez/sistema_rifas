# Sistema de Rifas — contexto para Claude Code

App web **Rifas Ivannia** para que mamá maneje rifas de 00 a 99 desde el celular: una **página pública** (números libres/ocupados, apartar por WhatsApp) y un **panel privado** (`/admin`) para asignar números, registrar abonos y mandar recordatorios.

- Especificación completa: `Plan del Sistema de Rifas.md`
- Avance y decisiones: `MEMORY.md` (leerlo al iniciar; actualizarlo al cerrar cada tarea)

## Stack
- Monorepo con npm workspaces: `api/` y `web/`.
- **web:** React 19 + Vite + Tailwind CSS 3 (`tailwind.config.js`), React Router 7, TanStack Query 5, Lucide React, vite-plugin-pwa (instalable; el service worker NO guarda `/api` ni `/uploads`). Luego: Recharts.
- **api:** Node 22 + Express 5 (ESM), Prisma 6, Zod 4, helmet, express-rate-limit, bcryptjs, multer (fotos).
- Sesión: token HMAC propio en cookie `sesion` httpOnly/sameSite=strict, 30 días (`api/src/middleware/auth.js`). Requiere `SESSION_SECRET`.
- **Base de datos:** PostgreSQL en Neon. `DATABASE_URL` (pooler) para la app, `DIRECT_URL` (sin pooler) para migraciones.
- **Sin Docker.** No crear Dockerfile ni docker-compose. En el VPS: Node + systemd + Caddy instalados directo; archivos y guía en `despliegue/`.

## Comandos
- `npm install` — instala todo (desde la raíz).
- `npm run dev` — levanta api (puerto 3000) y web (puerto 5173, con proxy `/api` y `/uploads`).
- `npm run build` — compila el frontend a `web/dist`.
- `npm run db:migrate -w api` — crea/aplica migraciones en desarrollo.
- `npm run db:deploy -w api` — aplica migraciones en producción.
- `npm run crear-admin -w api` — crea el usuario del panel o le cambia la contraseña.
- `npm run seed -w api` — carga datos de prueba si la base está vacía (`-- --reiniciar` borra todo y recarga; bloqueado en producción).
- Variables en `api/.env` (copiar de `api/.env.example`). Nunca subir `.env`.
- En el VPS: `despliegue/actualizar.sh` (pull, build, migraciones, reinicio) y `despliegue/respaldo.sh` (cron diario).
- En Windows, `prisma generate` falla (EPERM) si `npm run dev` está corriendo: detenerlo antes de migrar.

## Modelo de datos (`api/prisma/schema.prisma`)
Tablas: `admins`, `rifas`, `premios`, `clientes`, `boletos`, `pagos`, `recordatorios` (columnas en snake_case vía `@map`).
- `premios`: 1 a 3 por rifa (`lugar` 1, 2, 3), con `descripcion`, `costo` (privado, para la ganancia) y `numero_ganador`. Único `(rifa_id, lugar)`.
- `rifas.estado`: borrador | activa | finalizada | cancelada. **Solo una activa** (índice único parcial en la migración).
- `rifas.color_celdas` / `fuente_numeros`: estilo de la cuadrícula pública. Las opciones deben coincidir en `api/src/schemas.js` y `web/src/utils/temas.js`.
- `boletos.estado`: apartado | pagado. Único `(rifa_id, numero)`.
- `pagos.metodo`: efectivo | sinpe. Varios abonos por boleto.
- `clientes.telefono`: único, 8 dígitos (se antepone +506 al enviar a WhatsApp).
- Restricciones CHECK en la migración: número de dos cifras, teléfono de 8 dígitos, montos > 0.

## Reglas de negocio
- Saldo del boleto = `precio_numero − suma(pagos)`. Al llegar a 0 el boleto pasa a `pagado`.
- Número libre = número 00–99 sin boleto en la rifa activa. Los libres no se guardan.
- **Un número con pagos NO se puede liberar** (alguien pagó por él). Solo se puede borrar un pago mal ingresado.
- Un abono no puede pasar del saldo. El precio no cambia si ya hay números vendidos.
- Ganadores: cada premio (1.º, 2.º, 3.º) lo gana el número del mismo premio de la Lotería Nacional de Costa Rica.
- Al finalizar: se guarda un `numero_ganador` por premio y la rifa se cierra siempre. Si nadie tiene un número, ese premio queda "sin ganador"; un nuevo sorteo lo decide quien administra (fuera del sistema).
- La página pública muestra si cada premio tuvo ganador, nunca quién.
- Métricas se calculan con consultas, sin tablas extra.

## Reglas de código
- Textos de la interfaz en **español de Costa Rica**. Errores claros y que digan cómo arreglarlo (`ErrorApp` en la API).
- Montos **enteros en colones** (₡), formato local. Zona horaria `America/Costa_Rica`. Fechas como "domingo 15 de noviembre".
- Números de rifa **siempre texto de dos dígitos** (`"07"`).
- **Nunca** devolver nombres ni teléfonos en rutas `/api/public/*`.
- Validar toda entrada con Zod (`api/src/schemas.js`). Rutas `/api/admin/*` exigen sesión.
- Componentes pequeños con Tailwind. Clases comunes en `web/src/index.css` (`btn-primario`, `campo`, `tarjeta`…).
- **Nada de librerías nuevas sin preguntar.**
- No crear carpetas ni archivos innecesarios.

## Diseño
Paleta (Tailwind): `jade` #0F766E (principal, pagados), `jade-claro` #CCFBF1, `mango` #F59E0B (apartados), `coral` #E11D48 (peligro), `arena` #FAFAF7 (fondo), `tinta` #1C2B2A (texto), `whatsapp` #25D366 (solo botones WhatsApp).
Fuentes: `font-titulo` = Fraunces, `font-sans` = Nunito; para la cuadrícula también `font-baloo` y `font-bebas`. Cifras tabulares.
Logo: tómbola de bingo animada en SVG (`web/src/components/Logo.jsx`, respeta "reducir movimiento").
Estados de número: siempre color + forma/ícono (libre: cuadro con borde; elegido: bolita redonda animada; ocupado: gris tachado; apartado: mango claro + reloj; pagado: jade + check).
Usabilidad: texto ≥ 16 px, botones ≥ 48 px, un botón principal por pantalla, verbos en acciones, confirmación antes de liberar/borrar.

## Flujo de trabajo
- Una etapa a la vez (ver `MEMORY.md`). Commit al cerrar cada tarea en https://github.com/JefersonGomez/sistema_rifas (rama `main`).
