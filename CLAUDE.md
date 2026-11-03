# Sistema de Rifas — contexto para Claude Code

App web para que mamá maneje rifas de 00 a 99 desde el celular: una **página pública** (números libres/ocupados, apartar por WhatsApp) y un **panel privado** (`/admin`) para asignar números, registrar abonos y mandar recordatorios.

- Especificación completa: `Plan del Sistema de Rifas.md`
- Avance y decisiones: `MEMORY.md` (leerlo al iniciar; actualizarlo al cerrar cada tarea)

## Stack
- Monorepo con npm workspaces: `api/` y `web/`.
- **web:** React 19 + Vite + Tailwind CSS 3 (`tailwind.config.js`). Luego: React Router, TanStack Query, Lucide React, Recharts, vite-plugin-pwa.
- **api:** Node 22 + Express 5 (ESM), Prisma 6 + Zod.
- **Base de datos:** PostgreSQL en Neon. `DATABASE_URL` (pooler) para la app, `DIRECT_URL` (sin pooler) para migraciones.
- **Sin Docker.** No crear Dockerfile, docker-compose ni Caddyfile.

## Comandos
- `npm install` — instala todo (desde la raíz).
- `npm run dev` — levanta api (puerto 3000) y web (puerto 5173, con proxy `/api`).
- `npm run build` — compila el frontend a `web/dist`.
- `npm run db:migrate -w api` — crea/aplica migraciones en desarrollo.
- `npm run db:deploy -w api` — aplica migraciones en producción.
- Variables en `api/.env` (copiar de `api/.env.example`). Nunca subir `.env`.

## Modelo de datos (`api/prisma/schema.prisma`)
Tablas: `admins`, `rifas`, `clientes`, `boletos`, `pagos`, `recordatorios` (columnas en snake_case vía `@map`).
- `rifas.estado`: borrador | activa | finalizada | cancelada. **Solo una activa** (índice único parcial en la migración).
- `boletos.estado`: apartado | pagado. Único `(rifa_id, numero)`.
- `pagos.metodo`: efectivo | sinpe. Varios abonos por boleto.
- `clientes.telefono`: único, 8 dígitos (se antepone +506 al enviar a WhatsApp).
- Restricciones CHECK en la migración: número `^[0-9]{2}$`, teléfono `^[0-9]{8}$`, montos > 0.

## Reglas de negocio
- Saldo del boleto = `precio_numero − suma(pagos)`. Al llegar a 0 el boleto pasa a `pagado`.
- Número libre = número 00–99 sin boleto en la rifa activa. Los libres no se guardan.
- Al finalizar: se guarda `numero_ganador`; si nadie tiene ese número, "sin ganador".
- Métricas se calculan con consultas, sin tablas extra.

## Reglas de código
- Textos de la interfaz en **español de Costa Rica**. Errores claros y que digan cómo arreglarlo.
- Montos **enteros en colones** (₡), formato local. Zona horaria `America/Costa_Rica`. Fechas como "domingo 15 de noviembre".
- Números de rifa **siempre texto de dos dígitos** (`"07"`).
- **Nunca** devolver nombres ni teléfonos en rutas `/api/public/*`.
- Validar toda entrada con Zod. Rutas `/api/admin/*` exigen sesión.
- Componentes pequeños con Tailwind. **Nada de librerías nuevas sin preguntar.**
- No crear carpetas ni archivos innecesarios.

## Diseño
Paleta (Tailwind): `jade` #0F766E (principal, pagados), `jade-claro` #CCFBF1, `mango` #F59E0B (apartados), `coral` #E11D48 (peligro), `arena` #FAFAF7 (fondo), `tinta` #1C2B2A (texto), `whatsapp` #25D366 (solo botones WhatsApp).
Fuentes: `font-titulo` = Fraunces, `font-sans` = Nunito. Cifras tabulares en la cuadrícula.
Estados de número: siempre color + texto/ícono (libre: blanco borde jade; apartado: mango claro + reloj; pagado: jade + check).
Usabilidad: texto ≥ 16 px, botones ≥ 48 px, un botón principal por pantalla, verbos en acciones, confirmación antes de liberar/borrar.

## Flujo de trabajo
- Una etapa a la vez (ver `MEMORY.md`). Commit al cerrar cada tarea en https://github.com/JefersonGomez/sistema_rifas (rama `main`).
