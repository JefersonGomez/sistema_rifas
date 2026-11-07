import { prisma } from './db.js';
import { colones } from './saldos.js';

// Datos de la miniatura que muestran WhatsApp y otras redes al compartir la página de clientes.
// WhatsApp no ejecuta JavaScript: estos datos van escritos en el HTML (etiquetas Open Graph).

const SITIO = 'Rifas Ivannia';
const IMAGEN_MARCA = '/og-imagen.png'; // 1200 × 630, se usa cuando la rifa no tiene foto

const fechaFmt = new Intl.DateTimeFormat('es-CR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'America/Costa_Rica',
});

let cache = { hasta: 0, datos: null };

export async function datosVistaPrevia({ usarCache = false } = {}) {
  if (usarCache && Date.now() < cache.hasta) return cache.datos;

  const rifa = await prisma.rifa.findFirst({
    where: { estado: 'activa' },
    select: {
      titulo: true,
      fotoUrl: true,
      precioNumero: true,
      fechaSorteo: true,
      premios: { select: { descripcion: true }, orderBy: { lugar: 'asc' } },
      _count: { select: { boletos: true } },
    },
  });

  let datos;
  if (!rifa) {
    datos = {
      titulo: SITIO,
      descripcion: 'Pronto una nueva rifa. Vea los números libres y aparte el suyo por WhatsApp.',
      imagen: IMAGEN_MARCA,
    };
  } else {
    const libres = 100 - rifa._count.boletos;
    const partes = [`${colones(rifa.precioNumero)} el número`];
    partes.push(libres === 0 ? '¡Todos vendidos!' : `Quedan ${libres} ${libres === 1 ? 'número' : 'números'}`);
    if (rifa.fechaSorteo) partes.push(`Sorteo el ${fechaFmt.format(rifa.fechaSorteo).replace(',', '')}`);
    if (rifa.premios.length > 1) partes.push(`${rifa.premios.length} premios`);
    datos = {
      titulo: `${rifa.titulo} · ${SITIO}`,
      descripcion: partes.join(' · '),
      imagen: rifa.fotoUrl ?? IMAGEN_MARCA,
    };
  }

  cache = { hasta: Date.now() + 60_000, datos };
  return datos;
}

const escapar = (texto) =>
  String(texto).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// Etiquetas <meta> para insertar en el <head>. `base`: dirección pública, ej. https://rifasivannia.duckdns.org
export function etiquetasMeta(datos, base) {
  const imagen = new URL(datos.imagen, base).href;
  const etiquetas = {
    'og:type': 'website',
    'og:site_name': SITIO,
    'og:locale': 'es_CR',
    'og:url': new URL('/', base).href,
    'og:title': datos.titulo,
    'og:description': datos.descripcion,
    'og:image': imagen,
    'og:image:alt': datos.titulo,
  };
  return [
    `<title>${escapar(datos.titulo)}</title>`,
    `<meta name="description" content="${escapar(datos.descripcion)}" />`,
    ...Object.entries(etiquetas).map(([p, v]) => `<meta property="${p}" content="${escapar(v)}" />`),
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ');
}
