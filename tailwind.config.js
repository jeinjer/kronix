import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        yellow: {
          ...colors.yellow,
          400: '#FFE600', // Purer yellow
          300: '#FFF033', // Lighter hover pure yellow
          500: '#E6CF00', // Darker yellow, not orange
        }
      }
    },
  },
  plugins: [],
}