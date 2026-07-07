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
  theme: { extend: {} },
  plugins: [animate],
};
