import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          200: "#bce0ff",
          300: "#8ecdff",
          400: "#59b0ff",
          500: "#338eff",
          600: "#1b6ef5",
          700: "#1457e1",
          800: "#1747b6",
          900: "#193f8f",
          950: "#142857",
        },
      },
    },
  },
  plugins: [],
};

export default config;
