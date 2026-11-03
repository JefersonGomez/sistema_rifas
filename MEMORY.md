# Control del proyecto

Bitácora de avance. Actualizar al cerrar cada tarea o etapa.

## Estado actual
**Etapa 3 — Panel de mamá: terminada (2026-11-02), pendiente de revisión.**
Siguiente: Etapa 4 — Despliegue (sin Docker).

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

### 3. Panel de mamá ✅
- [x] Login y sesión (bcrypt, cookie httpOnly 30 días, 5 intentos fallidos / 15 min) + `npm run crear-admin -w api`
- [x] Rifas: crear, editar, publicar (una sola), finalizar con número ganador; foto JPG/PNG/WebP ≤ 5 MB (revisa bytes reales)
- [x] Estilo de cuadrícula por rifa: 5 colores × 4 letras, con vista previa; animación de bolita al tocar
- [x] Talonario: vender varios números (buscar o crear cliente, "¿ya pagó?"), abonar, borrar pago, cambiar dueño, liberar
- [x] Por cobrar: deudas por cliente de mayor a menor, recordatorio por WhatsApp y fecha del último
- [x] Compartir números libres por WhatsApp (Inicio y Talonario)
- [x] Inicio: vendidos, cobrado, pendiente, días para el sorteo y accesos rápidos
- [x] Marca "Rifas Ivannia" con logo de tómbola animada (también favicon)
- [x] Probado: API con script (sesión, ventas, abonos, reglas) y panel en navegador a 375 px y 1280 px

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
- **No se libera un número con pagos** (decisión del usuario). La API lo valida y usa `deleteMany` con condición para evitar carreras.
- **Página pública permite elegir varios números** y mandarlos en un solo mensaje de WhatsApp (el plan hablaba de uno).
- El mensaje de apartar usa el **título** de la rifa: "…de la rifa de la Freidora de aire". El título debe empezar con "Rifa…".
- Números públicos se refrescan cada 60 s y al volver a la pestaña (TanStack Query).
- La ruta pública `/rifa` expone el WhatsApp y SINPE de mamá (son de ella, no de clientes).
- `/rifa/ganador` muestra la última rifa finalizada solo cuando no hay rifa activa; `hayGanador` es un sí/no, sin datos del comprador.
- Sesión con token HMAC propio (sin jsonwebtoken ni express-session): menos dependencias y no necesita guardar sesiones.
- `bcryptjs` (JS puro) en vez de `bcrypt` para evitar compilar módulos nativos en Windows.
- Panel sin pantallas Clientes ni Métricas todavía (etapa 5). Finalizar rifa se adelantó a la etapa 3 para cerrar el ciclo completo.
- Fecha del sorteo se guarda al mediodía de Costa Rica para que no cambie de día por zona horaria.
- Rifa nueva copia WhatsApp, SINPE, regla y estilo de la rifa anterior. Por defecto WhatsApp y SINPE = 8326-0382.
- Abono con `SELECT … FOR UPDATE` para que dos pagos simultáneos no superen el precio.

## Pendientes / notas
- `npm audit`: 3 alertas altas en `deepmerge-ts` dentro del CLI de Prisma (solo desarrollo, no llega a producción). Revisar al subir de versión.
- **La base de Neon tiene datos de prueba** (seed). Antes de usarla con mamá hay que vaciarlos, o usar una rama de Neon aparte para desarrollo.
- WhatsApp para apartar: **8326-0382** (dado por el usuario). SINPE: se asumió el mismo número, **confirmar**.
- Al desplegar detrás de un proxy, configurar `app.set('trust proxy', 1)` para que el rate limit vea la IP real.
- Nombre: **Rifas Ivannia**. Regla: número del primer premio de la Lotería Nacional de Costa Rica.
- Pendiente: crear rama `desarrollo` en Neon y poner su URL en `api/.env`; la rama principal queda para datos reales.
- Vender tarda ~2 s (guardar + recargar desde Neon en EE. UU.). Optimizar si molesta.
- `api/uploads/` guarda las fotos; está en .gitignore y hay que respaldarla en el VPS.
