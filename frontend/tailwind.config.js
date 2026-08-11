/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bmt: {
          blue: '#0284c7',
          darkblue: '#0369a1',
          gold: '#eab308',
          emerald: '#059669',
          navy: '#0f172a'
        }
      }
    },
  },
  plugins: [],
}
