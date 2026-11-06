import { useEffect, useState } from 'react';

const CLAVE = 'rifas-modo';

// Modo claro/oscuro del panel. Se recuerda en este teléfono; la primera vez sigue al sistema.
export function useModoOscuro() {
  const [oscuro, setOscuro] = useState(() => {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado) return guardado === 'oscuro';
    } catch {
      /* sin acceso al almacenamiento: se usa el del sistema */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, oscuro ? 'oscuro' : 'claro');
    } catch {
      /* no se pudo guardar; igual funciona mientras la página esté abierta */
    }
    // Color de la barra del navegador en el celular.
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', oscuro ? '#0F1514' : '#0F766E');
  }, [oscuro]);

  return [oscuro, () => setOscuro((v) => !v)];
}
