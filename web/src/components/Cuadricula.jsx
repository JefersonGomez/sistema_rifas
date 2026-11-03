import Numero from './Numero.jsx';

// Cuadrícula 10 × 10. `celdas`: [{ numero, estado, onClick? }]
export default function Cuadricula({ celdas, tema }) {
  return (
    <div className="grid grid-cols-10 gap-1 sm:gap-2">
      {celdas.map((c) => (
        <Numero key={c.numero} {...c} color={tema?.color} fuente={tema?.fuente} />
      ))}
    </div>
  );
}
