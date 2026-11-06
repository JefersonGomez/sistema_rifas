// Medalla del lugar: oro (1), plata (2), bronce (3). Siempre con el número, no solo color.
const colores = {
  1: 'bg-mango text-tinta ring-amber-300',
  2: 'bg-slate-300 text-tinta ring-slate-200',
  3: 'bg-orange-700 text-white ring-orange-300',
};

export default function Medalla({ lugar, className = 'h-8 w-8 text-base' }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-titulo font-extrabold ring-2 ${colores[lugar]} ${className}`}
    >
      {lugar}
    </span>
  );
}
