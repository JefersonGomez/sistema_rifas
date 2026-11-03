# Control del proyecto

Bitácora de avance. Actualizar al cerrar cada tarea o etapa.

## Estado actual
**Etapa 1 — Base del proyecto: terminada (2026-11-02), pendiente de revisión.**
Siguiente: Etapa 2 — Página pública.

## Etapas
### 1. Base del proyecto ✅
- [x] Monorepo (npm workspaces `api`, `web`), `CLAUDE.md`, Tailwind con paleta y fuentes
- [x] `schema.prisma` y primera migración aplicada en Neon (`20261103021743_inicial`)
- [x] Express con `/api/health` (verifica conexión a la base) y página de prueba en web
- [x] `npm run dev` levanta web y api juntos

### 2. Página pública
- [ ] Endpoints `GET /api/public/rifa`, `/numeros`, `/ganador`
- [ ] Pantalla con premio, cuadrícula 10 × 10 y botón "Apartar por WhatsApp"
- [ ] Seed con rifa de ejemplo y clientes ficticios

### 3. Panel de mamá
- [ ] Login y sesión (bcrypt, cookie httpOnly, 30 días) + `npm run crear-admin`
- [ ] Crear y activar rifa con foto
- [ ] Talonario: vender, abonar, liberar
- [ ] Por cobrar con recordatorio por WhatsApp
- [ ] Compartir números libres

### 4. Despliegue (sin Docker)
- [ ] Definir cómo se corre en el VPS (Node directo + proceso administrador)
- [ ] HTTPS, subdominio, respaldos, PWA

### 5. Historial y métricas
- [ ] Finalizar rifa, historial, ficha de cliente, métricas, exportar CSV

## Decisiones tomadas
- **Sin Docker** (pedido del usuario). La etapa 4 del plan se replantea sin Dockerfile/Compose.
- **Prisma 6** (no 7/8): esquema clásico con `url`/`directUrl`, sin `prisma.config.ts` ni adaptadores.
- **`.env` vive en `api/`** (no en la raíz): Prisma lo carga solo y Node usa `--env-file`. Sin `dotenv`.
- `DATABASE_URL` = pooler de Neon (app); `DIRECT_URL` = conexión directa (migraciones).
- **Tailwind 3** porque el plan usa `tailwind.config.js`.
- Reglas en SQL dentro de la migración: una sola rifa activa (índice único parcial), CHECK de número, teléfono y montos.
- Llaves foráneas con `RESTRICT`: liberar un número con pagos se decide en la etapa 3.

## Pendientes / notas
- `npm audit`: 3 alertas altas en `deepmerge-ts` dentro del CLI de Prisma (solo desarrollo, no llega a producción). Revisar al subir de versión.
- Por definir con mamá: nombre visible ("Rifas de …"), WhatsApp y SINPE, regla exacta del ganador.
