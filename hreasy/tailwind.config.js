/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "palette-1": "#1B325F", // Deep Navy
        "palette-2": "#9CC4E4", // Soft Sky Blue
        "palette-3": "#E9F2F9", // Ice Blue Background
        "palette-4": "#3A89C9", // Bright Action Blue
        "palette-5": "#F26C4F", // Coral Orange Accent
      },
    },
  },
  plugins: [],
}
