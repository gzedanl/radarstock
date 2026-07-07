import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0B1220",
        panel: "#111827",
        "panel-raised": "#161F32",
        border: "#1F2937",
        teal: "#00D9A3",
        amber: "#F5A623",
        "text-high": "#E5E7EB",
        "text-medium": "#94A3B8",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      keyframes: {
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "blip-pulse": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
      },
      animation: {
        "radar-sweep": "radar-sweep 4s linear infinite",
        "blip-pulse": "blip-pulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
