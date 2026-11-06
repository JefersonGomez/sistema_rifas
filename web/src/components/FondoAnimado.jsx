// Fondo de la página de clientes: bolitas de tómbola muy tenues que flotan despacio.
// No se pueden tocar, no las leen los lectores de pantalla y se quedan quietas
// si el teléfono tiene activado "reducir movimiento".
const bolitas = [
  { x: '6%', y: '10%', tam: 64, color: '#0F766E', n: '07', dur: 22, ret: 0 },
  { x: '82%', y: '6%', tam: 48, color: '#F59E0B', n: '15', dur: 18, ret: -4 },
  { x: '90%', y: '38%', tam: 72, color: '#E11D48', n: '42', dur: 26, ret: -9 },
  { x: '3%', y: '52%', tam: 52, color: '#F59E0B', n: '88', dur: 24, ret: -13 },
  { x: '48%', y: '3%', tam: 40, color: '#E11D48', n: '03', dur: 20, ret: -7 },
  { x: '70%', y: '72%', tam: 56, color: '#0F766E', n: '61', dur: 28, ret: -2 },
  { x: '14%', y: '84%', tam: 68, color: '#E11D48', n: '29', dur: 23, ret: -16 },
  { x: '40%', y: '92%', tam: 44, color: '#0F766E', n: '90', dur: 19, ret: -11 },
  { x: '94%', y: '88%', tam: 50, color: '#F59E0B', n: '54', dur: 25, ret: -5 },
];

export default function FondoAnimado() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {bolitas.map((b) => (
        <span
          key={b.n}
          className="absolute flex items-center justify-center rounded-full font-titulo font-extrabold text-white opacity-[0.12] motion-safe:animate-flotar"
          style={{
            left: b.x,
            top: b.y,
            width: b.tam,
            height: b.tam,
            fontSize: b.tam * 0.38,
            background: `radial-gradient(circle at 30% 30%, #ffffff66, ${b.color} 55%)`,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.ret}s`,
          }}
        >
          {b.n}
        </span>
      ))}
    </div>
  );
}
