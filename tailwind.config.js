/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
  extend: {
    colors: {
      tg_bg: 'var(--tg-bg-color)',
      tg_text: 'var(--tg-text-color)',
      tg_hint: 'var(--tg-hint-color)',
    },
  },
},
  plugins: [],
}


