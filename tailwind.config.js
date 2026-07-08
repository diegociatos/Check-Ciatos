import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './constants.tsx',
    './components/**/*.{ts,tsx}',
  ],
  safelist: [
    // Classes derivadas em tempo de execução (MonthlyPerformanceView, geradas por replace()).
    'bg-blue-50', 'bg-green-50', 'bg-yellow-50', 'bg-red-50', 'bg-amber-50', 'bg-purple-50', 'bg-orange-50',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Títulos/display: serifa editorial da marca (Book Antiqua).
        titulo: ['Book Antiqua', 'Palatino Linotype', 'Palatino', 'URW Palladio L', 'Georgia', 'serif'],
        // Corpo/dados/inputs: sans legível (Inter). Também é a fonte padrão do body.
        corpo: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [animate],
};
