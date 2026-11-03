// Grupo de botones para elegir una sola opción (ej.: Efectivo / SINPE).
export default function Opciones({ nombre, opciones, valor, onCambiar }) {
  return (
    <div role="radiogroup" aria-label={nombre} className={`grid gap-2 ${opciones.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          onClick={() => onCambiar(o.valor)}
          className={`btn px-2 text-base ${valor === o.valor ? 'bg-jade text-white' : 'border-2 border-black/10 bg-white text-tinta'}`}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}
