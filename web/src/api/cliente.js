// Cliente fetch para la API. Lanza un Error con el mensaje en español que manda el servidor.
export async function pedir(ruta) {
  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, { credentials: 'same-origin' });
  } catch {
    throw new Error('No hay conexión. Revise el internet e intente de nuevo.');
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos.error || 'Algo salió mal. Intente de nuevo en un momento.');
  }
  return datos;
}
