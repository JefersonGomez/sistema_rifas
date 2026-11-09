# Control del proyecto

Bitácora de avance. Actualizar al cerrar cada tarea o etapa.

## Estado actual
**Todas las etapas de código terminadas. Publicada el 2026-11-09 en https://rifasivannia.duckdns.org** (VPS Contabo, Nginx + certbot, app en :3100, respaldo diario por cron del usuario `rifas`).
Siguiente: vaciar datos de prueba de la principal, borrar usuario `prueba`, volver a subir la foto de la licuadora en producción y probar con mamá con datos móviles.
- El VPS usa hora UTC: el cron del respaldo va a las 9:00 UTC = 3:00 a. m. en Costa Rica.
- Las fotos viven en `/opt/rifas/api/uploads` del VPS (las de la compu no se suben solas).

**2026-11-06 — Premios 1.º/2.º/3.º y mejoras visuales:**
- Tabla `premios` (1 a 3 por rifa). Migración `20261106120000_premios` pasó el premio de cada rifa al 1.er lugar sin perder datos y quitó `rifas.premio`, `costo_premio`, `numero_ganador`.
- Finalizar pide un número por premio; la rifa se cierra siempre. Premio sin dueño = "sin ganador"; el nuevo sorteo lo decide quien administra (decisión del usuario).
- Visual: medallas oro/plata/bronce (`Medalla.jsx`), tómbola animada cuando no hay foto, precio destacado sobre la foto, barra de vendidos (`BarraAvance.jsx`) en la página pública, Inicio con tarjeta principal (días y avance) y lista de premios.
- Página de clientes: fondo oscuro verde pino `#12312D` sin animación (el usuario pidió quitar las bolitas y el beige), foto del premio completa sin recortes, tarjetas blancas.
- Revisión en celulares (320, 360, 390, 430 px) de la página de clientes y del panel: sin desbordes, textos ≥ 16 px y botones ≥ 44 px (medido con script).
- El usuario ya usa el panel: creó la rifa "Licuadora Ninja" (#15). En una prueba se le reemplazó la foto por error; se dejó sin foto (ver memoria de Claude).
- **Modo claro/oscuro** en el panel con interruptor animado (sol/luna); se recuerda en el teléfono y la primera vez sigue al sistema. La página de clientes no cambia.
- **Historial de cada rifa** (`/admin/rifas/:id`, botón "Ver historial"): premios y ganadores, recaudado, por cobrar, ganancia, efectivo vs SINPE, compradores, deudores (con recordar) y todos los pagos. Descarga CSV para Excel (`/api/admin/rifas/:id/exportar`, separador `;` con BOM).
- **Compartir con miniatura**: botón "Compartir" en la página de clientes y tarjeta con vista previa estilo WhatsApp en Inicio del panel. El servidor escribe etiquetas Open Graph (solo en producción, con `APP_URL`). Fotos se achican a JPG ≤ 1200 px al subirlas (WebP → JPG). La foto actual de "Licuadora Ninja" es WebP: conviene volver a subirla.
- Usuario temporal de desarrollo `prueba` / `clave-de-prueba-123` en la base de prueba: **borrarlo antes de usar datos reales**.

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
- [x] Forma de correr en el VPS: Node 22 + systemd (`despliegue/rifas.service`), usuario `rifas`, app en `/opt/rifas`
- [x] HTTPS: el VPS ya usa Nginx en 80/443 para otros proyectos (portafolio, stockly en Docker, techrag en :3001), así que se cambió Caddy por un sitio de Nginx (`despliegue/nginx-rifas.conf`) + certbot. App en el puerto **3100**. Subdominio `rifasivannia.duckdns.org` → 169.58.105.198 (2026-11-08).
- [x] Respaldos: `despliegue/respaldo.sh` (pg_dump 18 + fotos, 14 días) por cron
- [x] Actualizar: `despliegue/actualizar.sh`
- [x] PWA instalable (manifest, íconos de tómbola, service worker); abre en `/admin`
- [x] Producción probada en la compu: cookie Secure, caché de assets, rutas directas, 404 de fotos, instalable sin errores
- [x] Guía paso a paso: `despliegue/README.md`
- [x] Ejecutar la guía en el VPS y registrar DuckDNS (2026-11-09)
- [ ] Vaciar datos de prueba de la rama principal de Neon antes de usarla de verdad
- [ ] Probar con mamá en su teléfono con datos móviles y ajustar

### 5. Historial y métricas
- [x] Finalizar rifa con ganadores, historial de cada rifa y exportar CSV (2026-11-06)
- [x] Clientes (2026-11-08): lista con buscador (sin tildes) y orden (más compran / deben / A–Z); ficha con totales, efectivo vs SINPE, premios ganados, rifas con números y deudas, recordar y corregir datos/notas. Solo en el panel: los clientes no se registran, se crean al vender.
- [x] Métricas (2026-11-08) con Recharts 3.10 (aprobado por el usuario): totales del año, ganancia por rifa, cobrado por mes, efectivo vs SINPE, tiempo de venta, clientes frecuentes y mapa de números más pedidos. Se carga aparte (lazy) para no hacer pesada la página pública.
- [x] Ajustes (2026-11-08): mamá edita los 3 mensajes de WhatsApp con palabras entre llaves ({numeros}, {rifa}…), vista previa y "volver al original". Tabla `ajustes` (una fila), migración `20261108120000_ajustes`.

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
- Panel con 5 pestañas en el celular (Inicio, Talonario, Por cobrar, Clientes, Rifas); en < 400 px las etiquetas bajan a 15 px para caber. Métricas se abre desde Inicio y Mis rifas; Ajustes con el engranaje del encabezado (en computadora ambos están en el menú).
- Las rifas canceladas no cuentan en lo gastado ni lo debido de un cliente.
- Finalizar rifa se adelantó a la etapa 3 para cerrar el ciclo completo.
- Fecha del sorteo se guarda al mediodía de Costa Rica para que no cambie de día por zona horaria.
- Rifa nueva copia WhatsApp, SINPE, regla y estilo de la rifa anterior. Por defecto WhatsApp y SINPE = 8326-0482.
- Abono con `SELECT … FOR UPDATE` para que dos pagos simultáneos no superen el precio.
- **Despliegue sin Docker**: systemd en vez de PM2 (viene con Ubuntu, sin dependencias). La app escucha en 127.0.0.1 (`HOST`) y confía en un proxy (`TRUST_PROXY=1`).
- PWA con `start_url: /admin` (la instala mamá). El login tiene enlace a la página pública por si un cliente la instala.
- Service worker solo guarda la interfaz; `/api` y `/uploads` siempre van al servidor (datos siempre frescos).
- `vite-plugin-pwa` 1.3 (no 2.0, salió hace un mes). Sus dependencias de compilación traen alertas de `npm audit` (solo al compilar).
- Neon corre PostgreSQL 18: el VPS necesita `postgresql-client-18` para `pg_dump`.

## Pendientes / notas
- `npm audit`: 3 alertas altas en `deepmerge-ts` dentro del CLI de Prisma (solo desarrollo, no llega a producción). Revisar al subir de versión.
- **La base de Neon tiene datos de prueba** (seed). Antes de usarla con mamá hay que vaciarlos, o usar una rama de Neon aparte para desarrollo.
- **WhatsApp y SINPE: 8326-0482** (confirmado por el usuario el 2026-11-06; el 8326-0382 era un error).
- Nombre: **Rifas Ivannia**. Regla: número del primer premio de la Lotería Nacional de Costa Rica.
- Neon: la rama principal se llama **production** (la usa el VPS, datos reales). La compu usa la rama **desarrollo** (creada el 2026-11-08 con copia de los datos de prueba) en `api/.env`.
- Vender tarda ~2 s (guardar + recargar desde Neon en EE. UU.). Optimizar si molesta.
- `api/uploads/` guarda las fotos; está en .gitignore y hay que respaldarla en el VPS.
