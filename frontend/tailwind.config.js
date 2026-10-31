/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#6651E8',
          700: '#533ed4',
          800: '#4331ab',
          900: '#342685',
        },
        navy: {
          900: '#172554',
          800: '#1e3a8a',
          700: '#1d4ed8',
        },
        accent: {
          teal: '#0F766E',
          tealHover: '#0d655e',
        },
        canvas: {
          light: '#F8F9FC',
          dark: '#0f172a',
          contrast: '#000000',
        }
      },
      fontSize: {
        'accessible-sm': '1.1rem',
        'accessible-base': '1.25rem',
        'accessible-lg': '1.5rem',
        'accessible-xl': '1.875rem',
        'accessible-2xl': '2.25rem',
      },
      minHeight: {
        'touch': '52px',
        'touch-lg': '64px',
      }
    },
  },
  plugins: [],
}

