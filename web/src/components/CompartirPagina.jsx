import { useQuery } from '@tanstack/react-query';
import { pedir } from '../api/cliente.js';
import BotonWhatsApp from './BotonWhatsApp.jsx';

// Mensaje para compartir la página de clientes. El enlace va en su propia línea:
// WhatsApp lo detecta y arma la miniatura con la foto, el título y la descripción.
export const mensajeCompartirPagina = (titulo) =>
  `🎟️ ${titulo ?? 'Rifas Ivannia'}\n¡Vea los números libres y aparte el suyo! 👇\n${window.location.origin}/`;

// Vista previa de cómo se verá el enlace en WhatsApp, con el botón para compartirlo.
export default function CompartirPagina() {
  const q = useQuery({ queryKey: ['public', 'vista-previa'], queryFn: () => pedir('/public/vista-previa') });
  const v = q.data;
  const dominio = window.location.host;

  return (
    <section className="tarjeta">
      <h2 className="text-lg font-extrabold">Compartir la página de clientes</h2>
      <p className="text-base text-tinta/70">Así se verá el enlace en WhatsApp:</p>

      {/* Burbuja de chat al estilo WhatsApp */}
      <div className="mt-3 rounded-2xl bg-[#d9fdd3] p-1.5 text-[#111b21] shadow-sm dark:bg-[#005c4b] dark:text-[#e9edef]">
        <div className="overflow-hidden rounded-xl bg-black/5 dark:bg-black/20">
          {v ? (
            <img src={v.imagen} alt="" className="aspect-[1.91/1] w-full bg-white object-cover" />
          ) : (
            <div className="aspect-[1.91/1] w-full animate-pulse bg-black/10" />
          )}
          <div className="px-3 py-2">
            <p className="line-clamp-2 text-base font-bold leading-snug">{v?.titulo ?? 'Cargando…'}</p>
            <p className="line-clamp-2 text-base leading-snug opacity-80">{v?.descripcion}</p>
            <p className="mt-0.5 text-base opacity-60">{dominio}</p>
          </div>
        </div>
        <p className="whitespace-pre-line px-2 pb-1 pt-2 text-base">
          {mensajeCompartirPagina(v?.titulo?.replace(' · Rifas Ivannia', ''))}
        </p>
      </div>

      <BotonWhatsApp mensaje={mensajeCompartirPagina(v?.titulo?.replace(' · Rifas Ivannia', ''))} className="mt-4 w-full">
        Compartir por WhatsApp
      </BotonWhatsApp>
      {dominio.startsWith('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(dominio) ? (
        <p className="mt-2 text-base text-tinta/60">
          La miniatura aparece en WhatsApp cuando la página está publicada en internet (no desde esta compu).
        </p>
      ) : null}
    </section>
  );
}
