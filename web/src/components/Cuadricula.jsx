import Numero from './Numero.jsx';

// Cuadrícula 10 × 10. `numeros`: [{ numero, estado }]; `elegidos`: Set de números seleccionados.
export default function Cuadricula({ numeros, elegidos, onTocar }) {
  return (
    <div className="grid grid-cols-10 gap-1 sm:gap-2">
      {numeros.map(({ numero, estado }) => (
        <Numero
          key={numero}
          numero={numero}
          estado={estado === 'libre' && elegidos.has(numero) ? 'elegido' : estado}
          onClick={() => onTocar(numero)}
        />
      ))}
    </div>
  );
}
