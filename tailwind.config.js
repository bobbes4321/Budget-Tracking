/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9f3',
          100: '#d6f0e2',
          200: '#aee0c7',
          300: '#79c9a4',
          400: '#46ad7f',
          500: '#249163',
          600: '#16744f',
          700: '#125c41',
          800: '#114a36',
          900: '#0f3d2e',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
