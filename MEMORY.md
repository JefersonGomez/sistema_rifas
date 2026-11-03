# Control del proyecto

Bitácora de avance. Actualizar al cerrar cada tarea o etapa.

## Estado actual
**Etapa 2 — Página pública: terminada (2026-11-02), pendiente de revisión.**
Siguiente: Etapa 3 — Panel de mamá.

## Etapas
### 1. Base del proyecto ✅
- [x] Monorepo (npm workspaces `api`, `web`), `CLAUDE.md`, Tailwind con paleta y fuentes
- [x] `schema.prisma` y primera migración aplicada en Neon (`20261103021743_inicial`)
- [x] Express con `/api/health` (verifica conexión a la base) y página de prueba en web
- [x] `npm run dev` levanta web y api juntos

### 2. Página pública ✅
- [x] Endpoints `GET /api/public/rifa`, `/rifa/numeros`, `/rifa/ganador` (con helmet y rate limit de 300 solicitudes / 15 min)
- [x] Pantalla con premio, cuadrícula 10 × 10 y botón "Apartar por WhatsApp"
- [x] Vista sin rifa activa: número ganador de la última rifa + "Pronto una nueva rifa"
- [x] Seed (`npm run seed -w api`): 30 clientes, rifa activa con 63 vendidos y abonos variados, rifa pasada con ganador 42
- [x] Probado a 360 px de ancho (sin scroll horizontal) con capturas en Edge headless

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
- **Página pública permite elegir varios números** y mandarlos en un solo mensaje de WhatsApp (el plan hablaba de uno).
- El mensaje de apartar usa el **título** de la rifa: "…de la rifa de la Freidora de aire". El título debe empezar con "Rifa…".
- Números públicos se refrescan cada 60 s y al volver a la pestaña (TanStack Query).
- La ruta pública `/rifa` expone el WhatsApp y SINPE de mamá (son de ella, no de clientes).
- `/rifa/ganador` muestra la última rifa finalizada solo cuando no hay rifa activa; `hayGanador` es un sí/no, sin datos del comprador.

## Pendientes / notas
- `npm audit`: 3 alertas altas en `deepmerge-ts` dentro del CLI de Prisma (solo desarrollo, no llega a producción). Revisar al subir de versión.
- **La base de Neon tiene datos de prueba** (seed). Antes de usarla con mamá hay que vaciarlos, o usar una rama de Neon aparte para desarrollo.
- Los WhatsApp/SINPE del seed son `88888888` (ficticios).
- Al desplegar detrás de un proxy, configurar `app.set('trust proxy', 1)` para que el rate limit vea la IP real.
- Por definir con mamá: nombre visible ("Rifas de …"), WhatsApp y SINPE, regla exacta del ganador.
