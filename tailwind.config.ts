import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Carteggio brand palette
        paper: "#f6f1e7",
        "paper-deep": "#ede5d3",
        ink: "#1a1814",
        "ink-soft": "#4a4338",
        "ink-faded": "#8a8275",
        accent: "#7a2e2a",
        "accent-soft": "#b8645f",
        rule: "#d9cfb8",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
