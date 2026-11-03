// Estilos de la cuadrícula que mamá elige por rifa (mantener igual que api/src/schemas.js).
// Las clases van completas para que Tailwind las incluya al compilar.
export const COLORES = {
  jade: {
    nombre: 'Jade',
    libre: 'border-jade text-jade hover:bg-jade-claro',
    elegido: 'border-jade bg-jade text-white',
    muestra: 'bg-jade',
  },
  azul: {
    nombre: 'Azul',
    libre: 'border-blue-700 text-blue-700 hover:bg-blue-50',
    elegido: 'border-blue-700 bg-blue-700 text-white',
    muestra: 'bg-blue-700',
  },
  morado: {
    nombre: 'Morado',
    libre: 'border-violet-700 text-violet-700 hover:bg-violet-50',
    elegido: 'border-violet-700 bg-violet-700 text-white',
    muestra: 'bg-violet-700',
  },
  rosa: {
    nombre: 'Rosa',
    libre: 'border-pink-600 text-pink-700 hover:bg-pink-50',
    elegido: 'border-pink-600 bg-pink-600 text-white',
    muestra: 'bg-pink-600',
  },
  naranja: {
    nombre: 'Naranja',
    libre: 'border-orange-600 text-orange-700 hover:bg-orange-50',
    elegido: 'border-orange-600 bg-orange-600 text-white',
    muestra: 'bg-orange-600',
  },
};

// `letra`: familia y grosor. `clase`: lo que usa la celda (Bebas es angosta, va más grande).
export const FUENTES = {
  nunito: { nombre: 'Redonda', letra: 'font-sans font-extrabold', clase: 'font-sans font-extrabold' },
  fraunces: { nombre: 'Elegante', letra: 'font-titulo font-extrabold', clase: 'font-titulo font-extrabold' },
  baloo: { nombre: 'Divertida', letra: 'font-baloo font-extrabold', clase: 'font-baloo font-extrabold' },
  bebas: { nombre: 'Tómbola', letra: 'font-bebas tracking-wider', clase: 'font-bebas text-xl tracking-wider sm:text-2xl' },
};

export const temaDe = (rifa) => ({
  color: COLORES[rifa?.colorCeldas] ?? COLORES.jade,
  fuente: FUENTES[rifa?.fuenteNumeros] ?? FUENTES.nunito,
});
