export function rutaNoEncontrada(_req, res) {
  res.status(404).json({ error: 'Esta ruta no existe.' });
}

// Express 5 envía aquí los errores de las rutas async.
export function manejarErrores(err, _req, res, _next) {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.expose ? err.message : 'Ocurrió un error en el servidor. Intente de nuevo en un momento.',
  });
}
