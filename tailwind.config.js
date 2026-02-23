/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Sarabun", "Inter", "sans-serif"],
        display: ["Inter", "Sarabun", "sans-serif"],
      },
      colors: {
        primary: "#10B981",
        secondary: "#3B82F6",
        dark: "#1F2937",
        light: "#F3F4F6",
      },
    },
  },
};
