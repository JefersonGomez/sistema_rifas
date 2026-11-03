// Tómbola de bingo animada: la jaula gira y las bolitas saltan adentro.
// Respeta "reducir movimiento" del teléfono (motion-safe).
const centro = { transformOrigin: '32px 30px', transformBox: 'view-box' };

export default function Logo({ className = 'h-12 w-12', animado = true }) {
  const giro = animado ? 'motion-safe:animate-girar' : '';
  const salto = animado ? 'motion-safe:animate-saltar' : '';
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      {/* soporte */}
      <path d="M32 34 20 56M32 34l12 22M14 56h36" stroke="#1C2B2A" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* jaula que gira */}
      <g className={giro} style={centro}>
        <polygon
          points="32,10 46.1,15.9 52,30 46.1,44.1 32,50 17.9,44.1 12,30 17.9,15.9"
          fill="#CCFBF1"
          stroke="#0F766E"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path d="M32 10v40M12 30h40M17.9 15.9l28.2 28.2M46.1 15.9 17.9 44.1" stroke="#0F766E" strokeWidth="1.5" opacity=".35" />
        <g className={salto}>
          <circle cx="25" cy="35" r="5" fill="#F59E0B" />
          <circle cx="38" cy="36" r="5" fill="#E11D48" />
          <circle cx="32" cy="24" r="5" fill="#0F766E" stroke="#fff" strokeWidth="1" />
        </g>
        {/* manivela */}
        <path d="M52 30h7v-7" stroke="#1C2B2A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      <circle cx="32" cy="30" r="3" fill="#1C2B2A" />
    </svg>
  );
}

export function Marca({ className = '' }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <Logo className="h-11 w-11 shrink-0" />
      <span className="font-titulo text-2xl font-extrabold leading-none text-tinta">
        Rifas <span className="text-jade">Ivannia</span>
      </span>
    </span>
  );
}
