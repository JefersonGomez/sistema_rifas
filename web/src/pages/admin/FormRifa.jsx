import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ImagePlus } from 'lucide-react';
import { pedir } from '../../api/cliente.js';
import { useRifas } from '../../hooks/useRifas.js';
import { useAvisos } from '../../components/Avisos.jsx';
import Cuadricula from '../../components/Cuadricula.jsx';
import { COLORES, FUENTES } from '../../utils/temas.js';
import { aFechaInput, formatoTelefono } from '../../utils/formato.js';

const WHATSAPP_MAMA = '83260382';
const REGLA = 'Gana el número del primer premio de la Lotería Nacional de Costa Rica';

const aFormulario = (r) => ({
  titulo: r.titulo ?? '',
  premio: r.premio ?? '',
  descripcion: r.descripcion ?? '',
  precioNumero: r.precioNumero ? String(r.precioNumero) : '',
  costoPremio: r.costoPremio ? String(r.costoPremio) : '',
  fechaSorteo: aFechaInput(r.fechaSorteo),
  reglaGanador: r.reglaGanador ?? REGLA,
  whatsapp: r.whatsapp ? formatoTelefono(r.whatsapp) : '',
  sinpeNumero: r.sinpeNumero ? formatoTelefono(r.sinpeNumero) : '',
  colorCeldas: r.colorCeldas ?? 'jade',
  fuenteNumeros: r.fuenteNumeros ?? 'nunito',
});

const soloDigitos = (v) => Number(String(v).replace(/\D/g, '')) || 0;

export default function FormRifa() {
  const { id } = useParams();
  const { rifas, isPending: cargandoLista } = useRifas();
  const rifaQ = useQuery({ queryKey: ['admin', 'rifa', id], queryFn: () => pedir(`/admin/rifas/${id}`), enabled: Boolean(id) });

  if (id ? rifaQ.isPending : cargandoLista) return <p className="py-10 text-center text-lg">Cargando…</p>;
  if (rifaQ.isError) return <p className="py-10 text-center text-lg text-coral">{rifaQ.error.message}</p>;

  // Rifa nueva: copia WhatsApp, SINPE, regla y estilo de la última rifa.
  const ultima = rifas[0];
  const inicial = id
    ? aFormulario(rifaQ.data.rifa)
    : aFormulario({
        whatsapp: ultima?.whatsapp ?? WHATSAPP_MAMA,
        sinpeNumero: ultima?.sinpeNumero ?? WHATSAPP_MAMA,
        reglaGanador: ultima?.reglaGanador ?? REGLA,
        colorCeldas: ultima?.colorCeldas,
        fuenteNumeros: ultima?.fuenteNumeros,
      });
  const vendidos = id ? (rifas.find((r) => r.id === Number(id))?.vendidos ?? 0) : 0;

  return <Formulario id={id} inicial={inicial} fotoActual={rifaQ.data?.rifa.fotoUrl} vendidos={vendidos} />;
}

function Formulario({ id, inicial, fotoActual, vendidos }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const avisar = useAvisos();
  const [f, setF] = useState(inicial);
  const [foto, setFoto] = useState(null);
  const [vistaFoto, setVistaFoto] = useState(fotoActual ?? null);
  const [errorFoto, setErrorFoto] = useState('');

  const cambiar = (campo) => (e) => setF((prev) => ({ ...prev, [campo]: e.target.value }));

  useEffect(() => () => vistaFoto?.startsWith('blob:') && URL.revokeObjectURL(vistaFoto), [vistaFoto]);

  const elegirFoto = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) return setErrorFoto('La foto debe ser JPG, PNG o WebP.');
    if (archivo.size > 5 * 1024 * 1024) return setErrorFoto('La foto pesa más de 5 MB. Elija una más liviana.');
    setErrorFoto('');
    setFoto(archivo);
    setVistaFoto(URL.createObjectURL(archivo));
  };

  const guardar = useMutation({
    mutationFn: async () => {
      const datos = {
        ...f,
        precioNumero: soloDigitos(f.precioNumero),
        costoPremio: soloDigitos(f.costoPremio),
        fechaSorteo: f.fechaSorteo || null,
      };
      if (id && vendidos > 0) delete datos.precioNumero;
      const { rifa } = await pedir(id ? `/admin/rifas/${id}` : '/admin/rifas', { metodo: id ? 'PATCH' : 'POST', datos });
      if (foto) {
        const formulario = new FormData();
        formulario.append('foto', foto);
        await pedir(`/admin/rifas/${rifa.id}/foto`, { metodo: 'POST', formulario });
      }
      return rifa;
    },
    onSuccess: (rifa) => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['public'] });
      avisar(id ? 'Cambios guardados.' : rifa.estado === 'borrador' ? 'Rifa creada. Toque "Publicar" cuando esté lista.' : 'Rifa creada.');
      navigate('/admin/rifas');
    },
  });

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        guardar.mutate();
      }}
    >
      <div>
        <button type="button" className="btn -ml-3 px-3 text-base text-jade" onClick={() => navigate('/admin/rifas')}>
          <ChevronLeft aria-hidden className="h-5 w-5" /> Mis rifas
        </button>
        <h1 className="font-titulo text-3xl font-extrabold">{id ? 'Editar rifa' : 'Nueva rifa'}</h1>
      </div>

      <section className="tarjeta space-y-4">
        <Campo id="titulo" etiqueta="Título" ayuda='Empiece con "Rifa…", así se lee bien en WhatsApp.'>
          <input id="titulo" className="campo" placeholder="Rifa de la Freidora de aire" value={f.titulo} onChange={cambiar('titulo')} />
        </Campo>
        <Campo id="premio" etiqueta="Premio">
          <input id="premio" className="campo" placeholder="Freidora de aire" value={f.premio} onChange={cambiar('premio')} />
        </Campo>
        <Campo id="descripcion" etiqueta="Descripción (opcional)">
          <textarea id="descripcion" rows={2} className="campo py-3" placeholder="Nueva en caja, 5 litros" value={f.descripcion} onChange={cambiar('descripcion')} />
        </Campo>

        <div>
          <p className="etiqueta">Foto del premio (opcional)</p>
          <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-black/15 bg-white p-3 hover:border-jade">
            {vistaFoto ? (
              <img src={vistaFoto} alt="Foto del premio" className="h-20 w-20 rounded-lg object-cover" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-lg bg-jade-claro">
                <ImagePlus aria-hidden className="h-8 w-8 text-jade" />
              </span>
            )}
            <span className="text-lg font-bold text-jade">{vistaFoto ? 'Cambiar foto' : 'Elegir foto'}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={elegirFoto} />
          </label>
          {errorFoto && <p className="mt-1 font-bold text-coral">{errorFoto}</p>}
        </div>
      </section>

      <section className="tarjeta space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Campo id="precio" etiqueta="Precio por número" ayuda={vendidos > 0 ? 'No se cambia: ya hay ventas.' : undefined}>
            <Colones id="precio" valor={f.precioNumero} onChange={cambiar('precioNumero')} disabled={vendidos > 0} placeholder="2000" />
          </Campo>
          <Campo id="costo" etiqueta="Costo del premio" ayuda="Para calcular la ganancia.">
            <Colones id="costo" valor={f.costoPremio} onChange={cambiar('costoPremio')} placeholder="35000" />
          </Campo>
        </div>
        <Campo id="fecha" etiqueta="Fecha del sorteo">
          <input id="fecha" type="date" className="campo" value={f.fechaSorteo} onChange={cambiar('fechaSorteo')} />
        </Campo>
        <Campo id="regla" etiqueta="Cómo se elige el ganador">
          <input id="regla" className="campo" value={f.reglaGanador} onChange={cambiar('reglaGanador')} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo id="whatsapp" etiqueta="WhatsApp">
            <input id="whatsapp" className="campo tabular-nums" inputMode="tel" value={f.whatsapp} onChange={cambiar('whatsapp')} />
          </Campo>
          <Campo id="sinpe" etiqueta="SINPE Móvil">
            <input id="sinpe" className="campo tabular-nums" inputMode="tel" value={f.sinpeNumero} onChange={cambiar('sinpeNumero')} />
          </Campo>
        </div>
      </section>

      <EstiloCuadricula f={f} setF={setF} />

      {guardar.isError && <p className="text-lg font-bold text-coral">{guardar.error.message}</p>}
      <button type="submit" className="btn-primario w-full" disabled={guardar.isPending}>
        {guardar.isPending ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear rifa'}
      </button>
    </form>
  );
}

function Campo({ id, etiqueta, ayuda, children }) {
  return (
    <div>
      <label className="etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      {children}
      {ayuda && <p className="mt-1 text-base text-tinta/60">{ayuda}</p>}
    </div>
  );
}

function Colones({ id, valor, onChange, ...resto }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-tinta/60">₡</span>
      <input id={id} className="campo pl-8 tabular-nums disabled:bg-black/5" inputMode="numeric" value={valor} onChange={onChange} {...resto} />
    </div>
  );
}

// Mamá elige color y letra de los números, y prueba cómo se ven tocándolos.
function EstiloCuadricula({ f, setF }) {
  const [elegidos, setElegidos] = useState(() => new Set(['07', '13']));
  const tema = { color: COLORES[f.colorCeldas], fuente: FUENTES[f.fuenteNumeros] };
  const ocupados = new Set(['02', '15', '18']);
  const celdas = Array.from({ length: 20 }, (_, i) => {
    const numero = String(i).padStart(2, '0');
    if (ocupados.has(numero)) return { numero, estado: 'ocupado' };
    return {
      numero,
      estado: elegidos.has(numero) ? 'elegido' : 'libre',
      onClick: () =>
        setElegidos((prev) => {
          const nueva = new Set(prev);
          nueva.has(numero) ? nueva.delete(numero) : nueva.add(numero);
          return nueva;
        }),
    };
  });

  return (
    <section className="tarjeta space-y-4">
      <div>
        <h2 className="text-xl font-extrabold">Estilo de la cuadrícula</h2>
        <p className="text-base text-tinta/70">Así verán los números los clientes. Toque los números para probar.</p>
      </div>

      <div>
        <p className="etiqueta">Color</p>
        <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-3">
          {Object.entries(COLORES).map(([clave, c]) => (
            <button
              key={clave}
              type="button"
              role="radio"
              aria-checked={f.colorCeldas === clave}
              aria-label={c.nombre}
              onClick={() => setF((p) => ({ ...p, colorCeldas: clave }))}
              className={`flex flex-col items-center gap-1 text-base ${f.colorCeldas === clave ? 'font-extrabold' : ''}`}
            >
              <span className={`h-12 w-12 rounded-full ${c.muestra} ${f.colorCeldas === clave ? 'ring-4 ring-tinta/25 ring-offset-2' : ''}`} />
              {c.nombre}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="etiqueta">Letra de los números</p>
        <div role="radiogroup" aria-label="Letra de los números" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(FUENTES).map(([clave, fu]) => (
            <button
              key={clave}
              type="button"
              role="radio"
              aria-checked={f.fuenteNumeros === clave}
              onClick={() => setF((p) => ({ ...p, fuenteNumeros: clave }))}
              className={`flex min-h-16 flex-col items-center justify-center rounded-xl border-2 ${
                f.fuenteNumeros === clave ? 'border-jade bg-jade-claro' : 'border-black/10 bg-white'
              }`}
            >
              <span className={`text-3xl leading-none ${fu.letra}`}>27</span>
              <span className="text-base">{fu.nombre}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-arena p-3">
        <Cuadricula celdas={celdas} tema={tema} />
      </div>
    </section>
  );
}
