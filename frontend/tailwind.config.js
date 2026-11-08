/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fuji: {
          dark: "#0a192f",
          navy: "#0f2b48",
          blue: "#1e3a8a",
          sky: "#0284c7",
          ice: "#f0f9ff",
          red: "#dc2626",
          torii: "#e11d48",
          gold: "#d97706",
          card: "#ffffff",
          surface: "#f8fafc"
        }
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "'Hiragino Sans'",
          "'Noto Sans JP'",
          "sans-serif"
        ]
      }
    },
  },
  plugins: [],
}
