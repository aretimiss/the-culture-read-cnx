/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // ใช้การสลับ dark ด้วย class บน html/body
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#8B0000",
        accent: "#4682B4",
        "background-light": "#f6f7f8",
        "background-dark": "#111c21",
      },
      fontFamily: {
        display: ["Newsreader", "serif"],
        sans: ["Noto Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
