/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        bg: "#0a0c10",
        surface: "#111318",
        border: "#1e2130",
        accent: "#00e5a0",
        "accent-dim": "#00b37d",
        danger: "#ff4560",
        warn: "#f5a623",
        info: "#3b9eff",
        muted: "#4a5568",
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(0,229,160,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,160,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-size": "40px 40px",
      },
    },
  },
  plugins: [],
};
