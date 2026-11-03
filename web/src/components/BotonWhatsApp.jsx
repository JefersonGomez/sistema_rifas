import { MessageCircle } from 'lucide-react';
import { enlaceWhatsApp } from '../utils/mensajesWhatsApp.js';

// Abre WhatsApp con el mensaje ya escrito. El verde se usa solo en estos botones.
export default function BotonWhatsApp({ telefono, mensaje, children }) {
  return (
    <a
      href={enlaceWhatsApp(telefono, mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 py-3 text-lg font-extrabold text-tinta shadow-sm active:scale-[0.98]"
    >
      <MessageCircle aria-hidden className="h-6 w-6" />
      {children}
    </a>
  );
}
