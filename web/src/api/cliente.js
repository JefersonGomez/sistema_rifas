export class ErrorApi extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

// Cliente fetch para la API. `datos` se manda como JSON; `formulario` (FormData) para subir fotos.
// Lanza ErrorApi con el mensaje en español que manda el servidor.
export async function pedir(ruta, { metodo = 'GET', datos, formulario } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: datos ? { 'Content-Type': 'application/json' } : undefined,
      body: formulario ?? (datos ? JSON.stringify(datos) : undefined),
    });
  } catch {
    throw new ErrorApi('No hay conexión. Revise el internet e intente de nuevo.', 0);
  }
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new ErrorApi(cuerpo.error || 'Algo salió mal. Intente de nuevo en un momento.', respuesta.status);
  }
  return cuerpo;
}
