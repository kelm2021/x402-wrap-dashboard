import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#121210",
        accent: "#C8942A",
        brand: {
          gold: "#C8942A",
          "gold-bright": "#D4A84B",
          black: "#1A1A1A",
          parchment: "#F5F0E8",
          slate: "#4A4A4A",
          warm: "#8C857A",
          red: "#C44536",
          green: "#3D7A4A"
        }
      }
    }
  },
  plugins: []
}

export default config
