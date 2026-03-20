import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1a73e8", dark: "#1557b0" },
        emergency: { bg: "#1a1a2e", text: "#ffffff", accent: "#fbbf24" },
        danger: "#dc2626",
        warning: "#f59e0b",
        success: "#16a34a",
      },
    },
  },
  plugins: [],
};

export default config;
