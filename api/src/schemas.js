import { z } from 'zod';

// Opciones de estilo de la cuadrícula (mantener igual que web/src/utils/temas.js).
export const COLORES = ['jade', 'azul', 'morado', 'rosa', 'naranja'];
export const FUENTES = ['nunito', 'fraunces', 'baloo', 'bebas'];

const textoOpcional = (max, nombre) =>
  z
    .string()
    .trim()
    .max(max, `${nombre} puede tener máximo ${max} letras.`)
    .transform((v) => v || null)
    .nullable()
    .optional();

// Acepta "8888-8888", "8888 8888" o "+506 8888 8888" y guarda solo los 8 dígitos.
const telefono = z
  .string({ error: 'Escriba el número de teléfono.' })
  .transform((v) => v.replace(/\D/g, '').replace(/^506(?=\d{8}$)/, ''))
  .pipe(z.string().regex(/^\d{8}$/, 'El teléfono debe tener 8 dígitos, por ejemplo 8888-8888.'));

const telefonoOpcional = z
  .string()
  .transform((v) => v.replace(/\D/g, '').replace(/^506(?=\d{8}$)/, '') || null)
  .pipe(z.string().regex(/^\d{8}$/, 'El teléfono debe tener 8 dígitos, por ejemplo 8888-8888.').nullable())
  .nullable()
  .optional();

const numero = z.string().regex(/^\d{2}$/, 'Los números van de 00 a 99, siempre con dos cifras.');

const id = (nombre) => z.number({ error: `Falta ${nombre}.` }).int().positive();

const colones = (nombre) =>
  z
    .number({ error: `Escriba ${nombre} en colones.` })
    .int(`${nombre} debe ser un monto sin decimales.`)
    .max(10_000_000, `${nombre} es demasiado alto.`);

export const loginSchema = z.object({
  usuario: z.string({ error: 'Escriba su usuario.' }).trim().min(1, 'Escriba su usuario.'),
  password: z.string({ error: 'Escriba su contraseña.' }).min(1, 'Escriba su contraseña.'),
});

export const clienteSchema = z.object({
  nombre: z
    .string({ error: 'Escriba el nombre del cliente.' })
    .trim()
    .min(2, 'Escriba el nombre del cliente.')
    .max(80, 'El nombre puede tener máximo 80 letras.'),
  telefono,
  notas: textoOpcional(300, 'La nota'),
});

export const clienteEditarSchema = clienteSchema.partial();

// "2026-11-15" → mediodía en Costa Rica, para que la fecha no se corra al cambiar de zona horaria.
const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Elija la fecha del sorteo.')
  .transform((v) => new Date(`${v}T12:00:00-06:00`))
  .nullable()
  .optional();

// Cada premio de la lista: la posición define el lugar (1.º, 2.º, 3.º).
const premio = z.object({
  descripcion: z
    .string({ error: 'Escriba cuál es el premio.' })
    .trim()
    .min(2, 'Escriba cuál es el premio.')
    .max(100, 'El premio puede tener máximo 100 letras.'),
  costo: colones('El costo del premio').nonnegative('El costo del premio no puede ser negativo.').default(0),
});

const camposRifa = {
  titulo: z
    .string({ error: 'Escriba el título de la rifa.' })
    .trim()
    .min(3, 'Escriba el título de la rifa, por ejemplo "Rifa de la Freidora de aire".')
    .max(100, 'El título puede tener máximo 100 letras.'),
  descripcion: textoOpcional(500, 'La descripción'),
  premios: z
    .array(premio, { error: 'Escriba cuál es el premio.' })
    .min(1, 'Escriba cuál es el premio.')
    .max(3, 'Puede haber máximo 3 premios: 1.º, 2.º y 3.º.'),
  precioNumero: colones('El precio por número').positive('El precio por número debe ser mayor a cero.'),
  fechaSorteo: fecha,
  reglaGanador: textoOpcional(200, 'La regla del ganador'),
  whatsapp: telefonoOpcional,
  sinpeNumero: telefonoOpcional,
  colorCeldas: z.enum(COLORES, 'Elija un color de la lista.'),
  fuenteNumeros: z.enum(FUENTES, 'Elija una letra de la lista.'),
};

export const rifaSchema = z.object({
  ...camposRifa,
  colorCeldas: camposRifa.colorCeldas.default('jade'),
  fuenteNumeros: camposRifa.fuenteNumeros.default('nunito'),
});

// Al editar todo es opcional y sin valores por defecto: no se sobrescribe lo que no viene.
export const rifaEditarSchema = z.object(camposRifa).partial();

// Un número ganador por cada premio, en orden: [1.º, 2.º, 3.º].
export const finalizarSchema = z.object({
  numerosGanadores: z.array(numero, { error: 'Escriba los números ganadores.' }).min(1).max(3),
});

export const ventaSchema = z.object({
  clienteId: id('elegir el cliente'),
  numeros: z
    .array(numero, { error: 'Elija al menos un número.' })
    .min(1, 'Elija al menos un número.')
    .max(100)
    .refine((l) => new Set(l).size === l.length, 'Hay números repetidos en la lista.'),
  // Si viene, se registra el pago completo de cada número con ese método.
  pagadoCon: z.enum(['efectivo', 'sinpe']).nullable().optional(),
});

export const cambioClienteSchema = z.object({ clienteId: id('elegir el cliente') });

export const pagoSchema = z.object({
  monto: colones('El monto').positive('El monto debe ser mayor a cero.'),
  metodo: z.enum(['efectivo', 'sinpe'], 'Elija si pagó en efectivo o por SINPE.'),
  referencia: textoOpcional(50, 'La referencia'),
  nota: textoOpcional(200, 'La nota'),
});

export const recordatorioSchema = z.object({
  clienteId: id('el cliente'),
  rifaId: id('la rifa'),
});

// Para parámetros de ruta como :id
export const idParam = z.coerce.number({ error: 'El identificador no es válido.' }).int().positive('El identificador no es válido.');
