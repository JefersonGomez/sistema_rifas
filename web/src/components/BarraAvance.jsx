// Barra de números vendidos (de 100). El texto acompaña siempre a la barra.
export default function BarraAvance({ vendidos, className = '' }) {
  return (
    <div className={className}>
      <div
        className="h-3 overflow-hidden rounded-full bg-black/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={vendidos}
        aria-label={`${vendidos} de 100 números vendidos`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-jade to-emerald-500 transition-[width] duration-700"
          style={{ width: `${vendidos}%` }}
        />
      </div>
    </div>
  );
}
