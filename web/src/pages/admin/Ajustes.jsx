import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { pedir } from '../../api/cliente.js';
import { useAvisos } from '../../components/Avisos.jsx';
import { PLANTILLAS, VARIABLES, mensajeApartar, mensajeCompartirLibres, mensajeRecordatorio } from '../../utils/mensajesWhatsApp.js';

// Datos de ejemplo para la vista previa de cada mensaje.
const RIFA_EJEMPLO = { titulo: 'Rifa de la Freidora de aire', precioNumero: 2000, fechaSorteo: '2026-11-15T18:00:00Z', sinpeNumero: '83260482' };
const MENSAJES = [
  {
    clave: 'apartar',
    campo: 'mensajeApartar',
    titulo: 'Para apartar',
    ayuda: 'Lo manda el cliente desde la página de la rifa.',
    ejemplo: (p) => mensajeApartar(['07', '27'], RIFA_EJEMPLO.titulo, p),
  },
  {
    clave: 'recordatorio',
    campo: 'mensajeRecordatorio',
    titulo: 'Recordatorio de pago',
    ayuda: 'Lo manda usted a quien debe.',
    ejemplo: (p) => mensajeRecordatorio({ nombre: 'María Rodríguez', debe: 1000, numeros: ['27'], rifa: RIFA_EJEMPLO }, p),
  },
  {
    clave: 'libres',
    campo: 'mensajeLibres',
    titulo: 'Compartir números libres',
    ayuda: 'Para grupos y estados de WhatsApp.',
    ejemplo: (p) => mensajeCompartirLibres(RIFA_EJEMPLO, ['03', '12', '45', '88'], p),
  },
];

// Ajustes: mamá cambia el texto de los mensajes de WhatsApp.
export default function Ajustes() {
  const q = useQuery({ queryKey: ['admin', 'ajustes'], queryFn: () => pedir('/admin/ajustes') });

  if (q.isPending) return <p className="py-10 text-center text-lg">Cargando…</p>;
  if (q.isError) return <p className="py-10 text-center text-lg text-coral">{q.error.message}</p>;
  return <FormAjustes guardados={q.data.ajustes} />;
}

function FormAjustes({ guardados }) {
  const queryClient = useQueryClient();
  const avisar = useAvisos();
  const [textos, setTextos] = useState(() =>
    Object.fromEntries(MENSAJES.map((m) => [m.campo, guardados[m.campo] ?? PLANTILLAS[m.clave]])),
  );

  const guardar = useMutation({
    // Si el texto quedó igual al de fábrica se guarda vacío, así toma las mejoras futuras.
    mutationFn: () =>
      pedir('/admin/ajustes', {
        metodo: 'PUT',
        datos: Object.fromEntries(
          MENSAJES.map((m) => [m.campo, textos[m.campo].trim() === PLANTILLAS[m.clave] ? null : textos[m.campo]]),
        ),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'ajustes'] });
      avisar('Mensajes guardados');
    },
    onError: (error) => avisar(error.message, 'error'),
  });

  const cambiar = (campo, valor) => setTextos((t) => ({ ...t, [campo]: valor }));
  const cajas = useRef({});

  // Pone {palabra} donde está el cursor (o al final), con un espacio si hace falta.
  const insertar = (campo, palabra) => {
    const caja = cajas.current[campo];
    const texto = textos[campo];
    const pos = caja && document.activeElement === caja ? caja.selectionStart : texto.length;
    const antes = texto.slice(0, pos);
    const agregado = `${antes && !/s$/.test(antes) ? ' ' : ''}{${palabra}}`;
    cambiar(campo, antes + agregado + texto.slice(pos));
    requestAnimationFrame(() => {
      caja?.focus();
      caja?.setSelectionRange(pos + agregado.length, pos + agregado.length);
    });
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        guardar.mutate();
      }}
    >
      <div>
        <h1 className="font-titulo text-3xl font-extrabold">Ajustes</h1>
        <p className="text-lg text-tinta/70">
          Cambie el texto de los mensajes de WhatsApp. Las palabras entre llaves, como <strong>{'{nombre}'}</strong>, se
          cambian solas por el dato real.
        </p>
      </div>

      {MENSAJES.map((m) => {
        const texto = textos[m.campo];
        const deFabrica = texto.trim() === PLANTILLAS[m.clave];
        return (
          <section key={m.campo} className="tarjeta space-y-3">
            <div>
              <h2 className="text-lg font-extrabold">{m.titulo}</h2>
              <p className="text-base text-tinta/60">{m.ayuda}</p>
            </div>
            <label className="sr-only" htmlFor={m.campo}>{m.titulo}</label>
            <textarea
              id={m.campo}
              ref={(el) => (cajas.current[m.campo] = el)}
              className="campo min-h-40 py-3 leading-snug"
              value={texto}
              maxLength={600}
              onChange={(e) => cambiar(m.campo, e.target.value)}
            />
            <div>
              <p className="etiqueta">Toque para agregar:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(VARIABLES[m.clave]).map(([clave, descripcion]) => (
                  <button
                    key={clave}
                    type="button"
                    title={descripcion}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertar(m.campo, clave)}
                    className="btn rounded-full border-2 border-jade/30 px-3 text-base font-bold text-jade"
                  >
                    {`{${clave}}`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="etiqueta">Así se verá:</p>
              <p className="whitespace-pre-line rounded-2xl bg-[#d9fdd3] px-4 py-3 text-base text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]">
                {texto.trim() ? m.ejemplo(texto) : m.ejemplo(PLANTILLAS[m.clave])}
              </p>
            </div>
            {!deFabrica && (
              <button type="button" className="btn w-full text-base text-tinta/70" onClick={() => cambiar(m.campo, PLANTILLAS[m.clave])}>
                <RotateCcw aria-hidden className="h-5 w-5" /> Volver al mensaje original
              </button>
            )}
          </section>
        );
      })}

      <button type="submit" className="btn-primario w-full" disabled={guardar.isPending}>
        {guardar.isPending ? 'Guardando…' : 'Guardar mensajes'}
      </button>
    </form>
  );
}
