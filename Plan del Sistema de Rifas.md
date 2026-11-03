# Plan del Sistema de Rifas

Nov 2, 2026 · @Jeferson

## Resumen

Una aplicación web para que mamá maneje sus rifas de 00 a 99 desde el celular o la computadora, sin papel. Tiene dos caras: una **página pública** donde los clientes ven qué números siguen libres, y un **panel privado** donde mamá asigna números, registra pagos y manda recordatorios.

Resuelve los tres problemas que hoy tiene:

- **Control en papel:** cada número, comprador y abono queda guardado y se puede buscar.
- **Recordatorios:** una lista de quién debe y cuánto, con un botón que abre WhatsApp con el mensaje ya escrito.
- **Dar a conocer los números libres:** un enlace público siempre actualizado y un botón para compartir la lista por WhatsApp.

Alcance: una rifa activa a la vez, ganador por la Lotería Nacional, pagos en efectivo o SINPE Móvil con abonos, e historial con métricas de rifas pasadas. Uso no comercial, costo cero.

## Decisiones tomadas

Es una aplicación propia (frontend + API + base de datos) desplegada en tu VPS, sin pagar dominio ni servicios.

| Tema | Decisión | Por qué |
| --- | --- | --- |
| Frontend | React + Vite + Tailwind CSS | Rápido, moderno y fácil de mantener con Claude Code |
| Íconos | Lucide React | Íconos limpios, consistentes y gratis |
| Gráficos de métricas | Recharts | Sencillo para barras y líneas en React |
| Backend | Node.js + Express | El stack que elegiste; una API REST simple |
| ORM y validación | Prisma + Zod | Migraciones ordenadas y datos validados antes de guardar |
| Base de datos | PostgreSQL en **Neon** (plan gratis) | Es Postgres puro y despierta solo cuando se usa. Supabase también sirve, pero en el plan gratis pausa proyectos inactivos |
| Fotos del premio | Carpeta `uploads/` en el VPS | Evita depender de otro servicio |
| Hosting | Tu VPS con Docker Compose | Todo en un solo lugar, fácil de reiniciar |
| Dominio | Subdominio gratis de **DuckDNS** (ej. `rifasmama.duckdns.org`) | Gratis y apunta a la IP del VPS |
| HTTPS | **Caddy** como proxy | Saca el certificado de Let's Encrypt solo |
| Moneda y zona horaria | Colones (₡), `America/Costa_Rica` | Todo se muestra en formato local |

**Cómo apartan los clientes (recomendación):** en la versión 1 el cliente toca un número libre y el botón **"Apartar por WhatsApp"** le abre un mensaje listo para mamá ("Hola, quiero el número 27 de la rifa…"). Mamá lo confirma en su panel. Así se evitan apartados falsos o bromas, y ella mantiene el control. En una etapa posterior se puede activar el apartado en línea con vencimiento automático (por ejemplo, 24 horas sin pago y el número se libera).

**Nota:** elegiste la opción B, pero el stack que definiste (React, Express, Postgres en tu VPS) corresponde a una aplicación propia. Este plan sigue ese stack.

## Arquitectura general

&#91;embedded content: arquitectura · VPS con Caddy y Node, datos en Neon\]

Clientes y mamá entran por el mismo subdominio. Caddy pone el HTTPS y pasa todo a la app de Node, que responde la API y sirve la interfaz de React ya compilada. La app guarda y lee los datos en Neon mediante Prisma, y un respaldo diario de la base queda en el VPS. WhatsApp no se conecta al sistema: la app solo abre enlaces con el mensaje ya escrito.

## Modelo de datos

Seis tablas cubren la rifa activa, el historial y las métricas. Los montos se guardan como enteros en colones y los números siempre como texto de dos dígitos (`"07"`), para no perder el cero.

| Tabla | Campos principales | Notas |
| --- | --- | --- |
| `admins` | id, usuario, password\_hash, creado\_en | Solo mamá (y tú como respaldo) |
| `rifas` | id, titulo, descripcion, premio, foto\_url, precio\_numero, costo\_premio, fecha\_sorteo, regla\_ganador, numero\_ganador, estado, sinpe\_numero, whatsapp, creada\_en, finalizada\_en | `estado`: borrador, activa, finalizada, cancelada. Solo puede haber una `activa` |
| `clientes` | id, nombre, telefono, notas, creado\_en | `telefono` único (8 dígitos, se le agrega +506 al enviar). Se reutilizan entre rifas |
| `boletos` | id, rifa\_id, numero, cliente\_id, estado, creado\_en | `estado`: apartado o pagado. Restricción única (rifa\_id, numero) para que nunca se repita un número |
| `pagos` | id, boleto\_id, monto, metodo, referencia, fecha, nota | `metodo`: efectivo o sinpe. Permite varios abonos por boleto |
| `recordatorios` | id, cliente\_id, rifa\_id, enviado\_en | Registra cuándo se tocó "Recordar", para no insistir dos veces el mismo día |

**Reglas de negocio:**

- El **saldo** de un boleto = `precio_numero − suma(pagos)`. Cuando llega a 0, el boleto pasa solo a `pagado`.
- Un número **libre** es cualquier número de 00 a 99 sin boleto en la rifa activa. No se guardan los libres.
- Al **finalizar** la rifa se guarda el número ganador y se busca el boleto con ese número. Si nadie lo compró, queda registrado como "sin ganador".
- Las **métricas** se calculan con consultas sobre estas tablas, sin tablas extra: total recaudado, porcentaje vendido, ganancia (recaudado − costo del premio), pendiente por cobrar, efectivo vs SINPE, clientes frecuentes y números más pedidos.

## API del backend

Una API REST bajo `/api`. Las rutas públicas nunca devuelven nombres ni teléfonos; las de administración exigen sesión.

**Públicas**

| Método | Ruta | Devuelve |
| --- | --- | --- |
| GET | `/api/public/rifa` | Rifa activa: título, premio, foto, precio, fecha, regla del ganador, WhatsApp de mamá |
| GET | `/api/public/rifa/numeros` | Los 100 números con estado `libre` u `ocupado` (sin datos del comprador) |
| GET | `/api/public/rifa/ganador` | Número ganador cuando la rifa está finalizada |

**Autenticación**

| Método | Ruta | Hace |
| --- | --- | --- |
| POST | `/api/auth/login` | Valida usuario y contraseña, crea cookie de sesión |
| POST | `/api/auth/logout` | Cierra la sesión |
| GET | `/api/auth/me` | Dice si hay sesión activa |

**Administración (requiere sesión)**

| Método | Ruta | Hace |
| --- | --- | --- |
| GET / POST | `/api/admin/rifas` | Lista el historial / crea una rifa nueva |
| GET / PATCH | `/api/admin/rifas/:id` | Ve o edita una rifa |
| POST | `/api/admin/rifas/:id/activar` | La publica (falla si ya hay otra activa) |
| POST | `/api/admin/rifas/:id/finalizar` | Guarda el número ganador y cierra la rifa |
| POST | `/api/admin/rifas/:id/foto` | Sube la foto del premio |
| GET | `/api/admin/rifas/:id/boletos` | Los 100 números con comprador, pagado y saldo |
| POST | `/api/admin/rifas/:id/boletos` | Asigna uno o varios números a un cliente |
| PATCH / DELETE | `/api/admin/boletos/:id` | Cambia de cliente o libera el número |
| POST | `/api/admin/boletos/:id/pagos` | Registra un abono (monto, método) |
| DELETE | `/api/admin/pagos/:id` | Corrige un pago mal ingresado |
| GET | `/api/admin/clientes?buscar=` | Busca clientes por nombre o teléfono |
| POST / PATCH | `/api/admin/clientes` | Crea o edita un cliente |
| GET | `/api/admin/rifas/:id/pendientes` | Clientes que deben, agrupados, con su saldo |
| POST | `/api/admin/recordatorios` | Registra que se envió un recordatorio |
| GET | `/api/admin/metricas` | Resumen general y por rifa |
| GET | `/api/admin/rifas/:id/exportar` | Lista de la rifa en CSV, como respaldo |

Todas las entradas se validan con Zod y los errores se devuelven en español claro (por ejemplo, "El número 27 ya está apartado por otra persona").

## Pantallas

Ocho pantallas en total: dos públicas y seis del panel. El panel usa una barra de navegación inferior en el celular (como una app) y una lateral en computadora.

**Página pública** (`/`)

1. **Rifa activa:** foto y nombre del premio, precio por número, fecha del sorteo y cómo se elige el ganador. Debajo, la cuadrícula de 10 × 10: libres en color, ocupados en gris. Al tocar un libre aparece el botón "Apartar por WhatsApp". Incluye un contador grande: "Quedan 37 números".
2. **Resultado:** cuando la rifa termina, la misma página muestra el número ganador. Si no hay rifa activa: "Pronto una nueva rifa".

**Panel de mamá** (`/admin`)

1. **Inicio:** resumen de la rifa activa (vendidos, cobrado, pendiente, días para el sorteo) y accesos rápidos: "Vender número", "Registrar pago", "Compartir números libres".
2. **Talonario:** la cuadrícula con tres estados (libre, apartado, pagado). Tocar un número abre una hoja inferior con el comprador, lo pagado, el saldo y los botones Abonar, Recordar y Liberar. Tocar uno libre abre "Vender": buscar o crear cliente y elegir varios números a la vez.
3. **Por cobrar:** lista de clientes que deben, ordenada de mayor a menor saldo, cada uno con su botón verde "Recordar por WhatsApp" y la fecha del último recordatorio.
4. **Clientes:** buscador, historial de cada cliente (rifas en las que participó, cuánto ha gastado) y botón para escribirle.
5. **Rifas:** crear la rifa nueva con un formulario de un solo paso, ver el historial y finalizar la activa ingresando el número ganador de la Lotería Nacional.
6. **Métricas:** totales del año, ganancia por rifa en barras, efectivo vs SINPE, clientes frecuentes y tiempo que tardó cada rifa en venderse.

**Mensajes de WhatsApp prellenados** (mamá los puede editar en Ajustes):

- Apartar (cliente → mamá): "Hola, quiero apartar el número 27 de la rifa de la Freidora de aire."
- Recordatorio (mamá → cliente): "Hola María, le recuerdo que tiene pendiente ₡1 000 del número 27 de la rifa de la Freidora de aire. El sorteo es el domingo 15 de noviembre. Puede pagar por SINPE al 8888-8888. ¡Gracias!"
- Compartir libres: "Rifa: Freidora de aire. ₡2 000 el número. Juega con la Lotería Nacional del 15 de noviembre. Libres: 03, 07, 12… Vea los números aquí: rifasmama.duckdns.org"

## Diseño visual

La dirección es "tómbola de barrio, pero ordenada": colores alegres con mucho blanco, letras grandes y botones que se tocan fácil con el pulgar.

**Paleta** (tokens de Tailwind en `tailwind.config.js`):

| Token | Color | Uso |
| --- | --- | --- |
| `jade` | #0F766E | Color principal, botones, números pagados |
| `jade-claro` | #CCFBF1 | Fondos de tarjetas y números libres al pasar el dedo |
| `mango` | #F59E0B | Números apartados (deben plata) y avisos |
| `coral` | #E11D48 | Acciones peligrosas (liberar número, borrar pago) |
| `arena` | #FAFAF7 | Fondo general |
| `tinta` | #1C2B2A | Texto principal |
| `whatsapp` | #25D366 | Solo para los botones de WhatsApp |

**Estados de un número** (siempre color + texto o ícono, nunca solo color):

- **Libre:** fondo blanco, borde jade, número en jade.
- **Apartado:** fondo mango claro, ícono de reloj.
- **Pagado:** fondo jade, número en blanco, ícono de check.

**Tipografía** (Google Fonts): **Fraunces** para títulos y el número grande del premio; **Nunito** para todo lo demás, por ser redonda y fácil de leer. Los números de la cuadrícula usan cifras tabulares para que queden alineados.

**Íconos:** Lucide React (`Ticket`, `Wallet`, `Bell`, `Users`, `Trophy`, `ChartBar`, `Share2`, `MessageCircle`).

**Reglas de usabilidad para mamá:**

- Texto mínimo de 16 px y botones de al menos 48 px de alto.
- Un solo botón principal por pantalla; las acciones con nombre de verbo ("Registrar pago", no "Guardar").
- Confirmación dentro de la app antes de liberar un número o borrar un pago.
- Mensajes de éxito cortos ("Pago de ₡1 000 registrado") y errores que dicen cómo arreglarlo.
- Todo en español de Costa Rica, montos con ₡ y fechas como "domingo 15 de noviembre".
- Instalable en el celular como app (PWA) con ícono en la pantalla de inicio.
- Modo oscuro opcional, no prioritario.

## Seguridad y privacidad

Los datos de los clientes (nombres y teléfonos) solo los ve mamá; la página pública solo sabe si un número está libre u ocupado.

- **Sesión:** contraseña con hash bcrypt, sesión en cookie `httpOnly`, `secure` y `sameSite=strict` (JWT firmado o `express-session`). Duración de 30 días para que mamá no tenga que entrar cada vez.
- **Sin registro público:** el usuario admin se crea con un script de semilla (`npm run crear-admin`), no hay pantalla de registro.
- **Protección de la API:** `helmet`, CORS solo para el propio dominio, `express-rate-limit` en el login (5 intentos por 15 minutos) y en las rutas públicas.
- **Validación:** Zod en cada ruta; Prisma evita inyección SQL.
- **Secretos:** `DATABASE_URL`, `SESSION_SECRET` y similares en un `.env` fuera del repositorio.
- **Fotos:** solo imágenes JPG, PNG o WebP de máximo 5 MB, renombradas al guardarlas.
- **Respaldos:** un `pg_dump` diario desde el VPS (cron) que guarda los últimos 14 días, además de la exportación CSV por rifa.
- **VPS:** firewall con solo los puertos 22, 80 y 443 abiertos; acceso SSH con llave.

**Aviso legal:** las rifas en Costa Rica tienen regulación propia. Como es algo familiar y no comercial, conviene que mamá lo confirme por su cuenta; el sistema no cambia eso.

## Despliegue en el VPS

Dos contenedores con Docker Compose: **Caddy** (HTTPS y proxy) y la **app de Node**, que sirve la API y también los archivos ya compilados de React. La base de datos queda afuera, en Neon.

1. **Subdominio gratis:** crear una cuenta en DuckDNS, registrar `rifasmama` y apuntarlo a la IP del VPS. Si la IP del VPS es fija, no hay que hacer nada más.
2. **Base de datos:** crear el proyecto en Neon, copiar la `DATABASE_URL` (con `sslmode=require`) y correr `npx prisma migrate deploy`.
3. **Preparar el VPS:** instalar Docker y Docker Compose, activar el firewall (`ufw allow 22,80,443`).
4. **Construir:** un `Dockerfile` de varias etapas que compila el frontend con Vite y copia `dist/` dentro de la imagen del servidor Express.
5. **Caddyfile:** `rifasmama.duckdns.org { reverse_proxy app:3000 }`. Caddy saca y renueva el certificado HTTPS solo.
6. **Levantar:** `docker compose up -d --build`. La carpeta `uploads/` va en un volumen para que las fotos no se pierdan.
7. **Actualizar:** `git pull && docker compose up -d --build`. Más adelante se puede automatizar con GitHub Actions por SSH.
8. **Respaldos:** cron diario con `pg_dump` hacia `/backups` en el VPS.

**Variables de entorno (`.env`):** `DATABASE_URL`, `SESSION_SECRET`, `APP_URL`, `PORT=3000`, `TZ=America/Costa_Rica`, `UPLOAD_DIR=/app/uploads`.

**Alternativa si no quieres DuckDNS:** Cloudflare Tunnel también es gratis, pero necesita un dominio propio en Cloudflare, así que no aplica por ahora.

## Estructura del repositorio

Un solo repositorio (monorepo con npm workspaces) con dos paquetes: `web` y `api`.

```
rifas-mama/
├── CLAUDE.md              # contexto para Claude Code
├── docker-compose.yml
├── Caddyfile
├── Dockerfile
├── .env.example
├── package.json           # workspaces: web, api
├── api/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js        # crea el usuario admin
│   └── src/
│       ├── index.js       # arranca Express y sirve web/dist
│       ├── config.js
│       ├── middleware/    # auth, errores, rate limit
│       ├── routes/        # public, auth, rifas, boletos, pagos, clientes, metricas
│       ├── services/      # lógica: saldos, ganador, métricas
│       └── schemas/       # validaciones Zod
└── web/
    ├── index.html
    ├── tailwind.config.js # paleta y fuentes
    └── src/
        ├── main.jsx
        ├── api/           # cliente fetch
        ├── components/    # Cuadricula, Numero, HojaInferior, BotonWhatsApp
        ├── pages/
        │   ├── publica/   # RifaPublica
        │   └── admin/     # Inicio, Talonario, PorCobrar, Clientes, Rifas, Metricas, Login
        ├── hooks/
        └── utils/         # formatoColones, fechas, mensajesWhatsApp
```

Librerías del frontend: React Router, TanStack Query (datos y caché), Lucide React, Recharts y `vite-plugin-pwa`.

## Plan por etapas

Cinco etapas; al terminar la 3 mamá ya puede dejar el papel. Cada etapa termina con algo que se puede probar en el celular.

1. **Base del proyecto**
   - [ ] Crear el monorepo, `CLAUDE.md`, Tailwind con la paleta y las fuentes
   - [ ] Crear la base en Neon, `schema.prisma` y primera migración
   - [ ] Express con `/api/health` y el frontend mostrando una página de prueba
   - **Listo cuando:** `npm run dev` levanta web y api juntos.
2. **Página pública**
   - [ ] Endpoints públicos de rifa y números
   - [ ] Pantalla con premio, cuadrícula 10 × 10 y botón "Apartar por WhatsApp"
   - **Listo cuando:** se ve bien en un celular con datos de prueba.
3. **Panel de mamá (lo esencial)**
   - [ ] Login y sesión
   - [ ] Crear y activar rifa con foto
   - [ ] Talonario: vender números, registrar abonos, liberar números
   - [ ] Por cobrar con recordatorio por WhatsApp
   - [ ] Compartir números libres
   - **Listo cuando:** mamá maneja una rifa completa sin papel.
4. **Despliegue**
   - [ ] DuckDNS, Docker Compose, Caddy y HTTPS en el VPS
   - [ ] Respaldos diarios y PWA instalable
   - [ ] Probar con mamá en su teléfono y ajustar lo que le cueste
   - **Listo cuando:** funciona en `rifasmama.duckdns.org` desde los datos móviles.
5. **Historial y métricas**
   - [ ] Finalizar rifa con número ganador y página de resultado
   - [ ] Historial de rifas y ficha de cada cliente
   - [ ] Pantalla de métricas con gráficos
   - [ ] Exportar CSV

**Ideas para después:** apartado en línea con vencimiento, varias rifas al mismo tiempo, leer el resultado de la Lotería Nacional automáticamente desde la JPS y modo oscuro.

## Cómo trabajar con Claude Code

Pídele una etapa a la vez y que te muestre un plan antes de escribir código; así revisas antes de que toque archivos.

- **Primero el `CLAUDE.md`:** pega ahí el resumen, el stack, el modelo de datos, la paleta y las reglas de usabilidad de este documento. Claude Code lo lee en cada sesión y no tendrás que repetirlo.
- **Reglas que conviene poner en `CLAUDE.md`:** textos de la interfaz en español de Costa Rica; montos enteros en colones; números de rifa como texto de dos dígitos; nunca exponer nombres ni teléfonos en rutas públicas; componentes pequeños con Tailwind; nada de librerías nuevas sin preguntar.
- **Un prompt por tarea**, por ejemplo: "Etapa 2: crea `GET /api/public/rifa/numeros` según el modelo del CLAUDE.md y el componente `Cuadricula` con los estados libre y ocupado. Primero muéstrame el plan."
- **Probar cada etapa** en el celular antes de pasar a la siguiente, y hacer un commit al cerrar cada tarea.
- **Datos de prueba:** pídele un `seed` con una rifa de ejemplo, 30 clientes ficticios y abonos variados para ver la cuadrícula llena.

**Antes de empezar, quedan por definir:**

- [ ] El nombre que verán los clientes (por ejemplo, "Rifas de Doña Ana").
- [ ] El número de WhatsApp y SINPE de mamá.
- [ ] La regla exacta del ganador (por ejemplo, las dos últimas cifras del premio mayor).
