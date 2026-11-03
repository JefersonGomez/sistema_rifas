import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pedir } from '../../api/cliente.js';
import HojaInferior from '../../components/HojaInferior.jsx';
import BuscadorCliente from '../../components/BuscadorCliente.jsx';
import Opciones from '../../components/Opciones.jsx';
import { useAvisos } from '../../components/Avisos.jsx';
import { formatoColones, formatoTelefono, unirLista } from '../../utils/formato.js';

// Vender uno o varios números: elegir (o crear) el cliente y decir si ya pagó.
export default function HojaVender({ rifa, numeros, onCerrar, onVendido }) {
  const queryClient = useQueryClient();
  const avisar = useAvisos();
  const [cliente, setCliente] = useState(null);
  const [pago, setPago] = useState('no');
  const total = numeros.length * rifa.precioNumero;

  const vender = useMutation({
    mutationFn: () =>
      pedir(`/admin/rifas/${rifa.id}/boletos`, {
        metodo: 'POST',
        datos: { clienteId: cliente.id, numeros, pagadoCon: pago === 'no' ? null : pago },
      }),
    // Espera a recargar el talonario antes de cerrar, para que los números ya se vean vendidos.
    onSuccess: async ({ mensaje }) => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      avisar(mensaje);
      onVendido();
    },
    // Si alguien tomó un número a la vez, refresca para que se vea ocupado.
    onError: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const titulo = numeros.length === 1 ? `Vender el ${numeros[0]}` : `Vender ${numeros.length} números`;

  return (
    <HojaInferior titulo={titulo} onCerrar={onCerrar}>
      <p className="mb-4 text-lg">
        {numeros.length === 1 ? 'Número' : 'Números'} <strong className="tabular-nums">{unirLista(numeros)}</strong> ·{' '}
        <strong>{formatoColones(total)}</strong>
      </p>

      {!cliente ? (
        <BuscadorCliente onElegir={setCliente} />
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            vender.mutate();
          }}
        >
          <div className="tarjeta flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-extrabold">{cliente.nombre}</p>
              <p className="tabular-nums text-tinta/70">{formatoTelefono(cliente.telefono)}</p>
            </div>
            <button type="button" className="btn px-3 text-base text-jade" onClick={() => setCliente(null)}>
              Cambiar
            </button>
          </div>

          <div>
            <p className="etiqueta">¿Ya pagó?</p>
            <Opciones
              nombre="¿Ya pagó?"
              valor={pago}
              onCambiar={setPago}
              opciones={[
                { valor: 'no', texto: 'Todavía no' },
                { valor: 'efectivo', texto: 'Efectivo' },
                { valor: 'sinpe', texto: 'SINPE' },
              ]}
            />
          </div>

          {vender.isError && <p className="font-bold text-coral">{vender.error.message}</p>}
          <button type="submit" className="btn-primario w-full" disabled={vender.isPending}>
            {vender.isPending
              ? 'Guardando…'
              : `${pago === 'no' ? 'Apartar' : 'Vender'} ${numeros.length === 1 ? 'número' : 'números'}${
                  pago !== 'no' ? ` y registrar ${formatoColones(total)}` : ''
                }`}
          </button>
        </form>
      )}
    </HojaInferior>
  );
}
