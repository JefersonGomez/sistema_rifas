import { ZodError } from 'zod';
import multer from 'multer';
import { Prisma } from '@prisma/client';

// Error con mensaje en español pensado para mostrarse a mamá tal cual.
export class ErrorApp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

export function rutaNoEncontrada(_req, res) {
  res.status(404).json({ error: 'Esta ruta no existe.' });
}

// Express 5 envía aquí los errores de las rutas async.
export function manejarErrores(err, _req, res, _next) {
  if (err instanceof ErrorApp) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues[0]?.message || 'Revise los datos ingresados.' });
  }
  if (err instanceof multer.MulterError) {
    const mensaje =
      err.code === 'LIMIT_FILE_SIZE' ? 'La foto pesa más de 5 MB. Elija una más liviana.' : 'No se pudo subir la foto.';
    return res.status(400).json({ error: mensaje });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === 'P2025' || err.code === 'P2003')) {
    return res.status(404).json({ error: 'No se encontró el registro. Actualice la pantalla e intente de nuevo.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Los datos enviados no son válidos.' });
  }

  console.error(err);
  res.status(500).json({ error: 'Ocurrió un error en el servidor. Intente de nuevo en un momento.' });
}
