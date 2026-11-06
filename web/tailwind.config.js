/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        jade: { DEFAULT: '#0F766E', claro: '#CCFBF1' },
        mango: { DEFAULT: '#F59E0B', claro: '#FEF3C7' },
        coral: '#E11D48',
        arena: '#FAFAF7',
        // Fondo neutro cálido de la página de clientes (no blanco).
        piedra: '#E4DCCE',
        tinta: '#1C2B2A',
        whatsapp: '#25D366',
      },
      fontFamily: {
        titulo: ['Fraunces', 'serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        baloo: ['"Baloo 2"', 'Nunito', 'sans-serif'],
        bebas: ['"Bebas Neue"', 'Nunito', 'sans-serif'],
      },
      keyframes: {
        girar: { to: { transform: 'rotate(360deg)' } },
        // Al elegir un número la celda "cae" como bolita de tómbola.
        bolita: {
          '0%': { transform: 'scale(0.6) rotate(-200deg)' },
          '60%': { transform: 'scale(1.18) rotate(10deg)' },
          '100%': { transform: 'scale(1) rotate(0)' },
        },
        saltar: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        subir: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        aparecer: { from: { opacity: 0 }, to: { opacity: 1 } },
        // Bolitas del fondo: suben y bajan muy despacio.
        flotar: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(12px, -28px) rotate(12deg)' },
          '100%': { transform: 'translate(0, 0) rotate(0deg)' },
        },
      },
      animation: {
        girar: 'girar 3.2s linear infinite',
        bolita: 'bolita 0.45s cubic-bezier(.3,1.4,.5,1)',
        saltar: 'saltar 0.8s ease-in-out infinite',
        subir: 'subir 0.25s ease-out',
        aparecer: 'aparecer 0.2s ease-out',
        flotar: 'flotar 20s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
