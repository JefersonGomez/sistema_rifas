import { Check, Clock } from 'lucide-react';
import { COLORES, FUENTES } from '../utils/temas.js';

// Una celda de la cuadrícula. Cada estado se distingue por color Y por forma o ícono:
//  libre: cuadro con borde · elegido: bolita redonda · ocupado: gris tachado
//  apartado (panel): mango con reloj · pagado (panel): jade con check
const fijos = {
  ocupado: 'rounded-lg border-transparent bg-gray-200 text-gray-400 line-through',
  apartado: 'rounded-lg border-mango bg-mango-claro text-amber-900 dark:text-amber-200',
  pagado: 'rounded-lg border-jade bg-jade text-sobrejade',
};

const textoEstado = {
  libre: 'libre',
  elegido: 'elegido',
  ocupado: 'ocupado',
  apartado: 'apartado, debe dinero',
  pagado: 'pagado',
};

export default function Numero({ numero, estado, onClick, color = COLORES.jade, fuente = FUENTES.nunito }) {
  const clases =
    estado === 'libre'
      ? `rounded-lg bg-superficie ${color.libre}`
      : estado === 'elegido'
        ? `rounded-full shadow-md motion-safe:animate-bolita ${color.elegido}`
        : fijos[estado];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={estado === 'elegido' || undefined}
      aria-label={`Número ${numero}, ${textoEstado[estado]}`}
      className={`relative flex aspect-square items-center justify-center border-2 text-base tabular-nums transition-colors active:scale-90 disabled:active:scale-100 sm:text-lg ${fuente.clase} ${clases}`}
    >
      {numero}
      {estado === 'apartado' && (
        <Clock aria-hidden strokeWidth={3} className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-mango p-0.5 text-white ring-2 ring-arena" />
      )}
      {estado === 'pagado' && (
        <Check aria-hidden strokeWidth={4} className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-superficie p-0.5 text-jade ring-2 ring-jade" />
      )}
    </button>
  );
}
