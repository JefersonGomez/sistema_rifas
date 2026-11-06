import { MessageCircle } from 'lucide-react';
import { enlaceWhatsApp } from '../utils/mensajesWhatsApp.js';

// Abre WhatsApp con el mensaje ya escrito. El verde se usa solo en estos botones.
export default function BotonWhatsApp({ telefono, mensaje, onClick, className = 'w-full', children }) {
  return (
    <a
      href={enlaceWhatsApp(telefono, mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`btn bg-whatsapp text-[#1C2B2A] shadow-sm hover:brightness-95 ${className}`}
    >
      <MessageCircle aria-hidden className="h-6 w-6 shrink-0" />
      {children}
    </a>
  );
}
