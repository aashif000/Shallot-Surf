/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0a84ff",
        bg: "#f6fbff",
        card: "#ffffff",
        text: "#0b1526",
        muted: "#6b7280",
        accent: "#f59e0b",
      },
      borderRadius: {
        xl: "16px"
      },
      spacing: {
        18: "4.5rem"
      }
    },
  },
  plugins: [],
};
