// Achica la foto en el teléfono antes de subirla (máx. 1200 px, JPG).
// Así carga rápido y WhatsApp muestra la miniatura (no la muestra si la imagen pesa mucho).
const LADO_MAX = 1200;

export async function reducirFoto(archivo) {
  try {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAX / Math.max(imagen.width, imagen.height));
    // Si ya es pequeña, liviana y JPG/PNG, se sube tal cual. WebP se pasa a JPG:
    // WhatsApp no siempre muestra miniaturas WebP.
    if (escala === 1 && archivo.size < 300 * 1024 && archivo.type !== 'image/webp') return archivo;

    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    const ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#ffffff'; // fondo blanco para PNG con transparencia
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    ctx.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

    const blob = await new Promise((listo) => lienzo.toBlob(listo, 'image/jpeg', 0.82));
    if (!blob) return archivo;
    const esWebp = archivo.type === 'image/webp';
    return esWebp || blob.size < archivo.size ? new File([blob], 'foto.jpg', { type: 'image/jpeg' }) : archivo;
  } catch {
    return archivo; // si el navegador no puede procesarla, se sube la original
  }
}
