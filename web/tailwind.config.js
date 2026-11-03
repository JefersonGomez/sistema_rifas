/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        jade: { DEFAULT: '#0F766E', claro: '#CCFBF1' },
        mango: '#F59E0B',
        coral: '#E11D48',
        arena: '#FAFAF7',
        tinta: '#1C2B2A',
        whatsapp: '#25D366',
      },
      fontFamily: {
        titulo: ['Fraunces', 'serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
