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
      colors: {
        // Marca Grupo Ciatos — vermelho editorial (ação + identidade).
        marca: {
          DEFAULT: '#8B1B1F',
          escuro: '#6F0F14',
          claro: '#A83236',
        },
        fundo: '#faf7f2', // off-white quente (predomínio 60%)
        superficie: '#ffffff',
        tinta: '#1c1917', // grafite quente para texto
        // Semânticas de status (separadas da marca)
        sucesso: '#15803d',
        atraso: '#b45309',
        erro: '#dc2626',
      },
      fontFamily: {
        // App inteiro em Book Antiqua (serifa editorial da marca). Fallbacks cobrem
        // outros sistemas: Palatino (Mac), URW Palladio (Linux), Georgia (universal).
        titulo: ['Book Antiqua', 'Palatino Linotype', 'Palatino', 'URW Palladio L', 'Georgia', 'serif'],
        corpo: ['Book Antiqua', 'Palatino Linotype', 'Palatino', 'URW Palladio L', 'Georgia', 'serif'],
        sans: ['Book Antiqua', 'Palatino Linotype', 'Palatino', 'URW Palladio L', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [animate],
};
