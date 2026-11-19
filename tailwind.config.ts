import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF7",
        ink: "#14181F",
        muted: "#5B6069",
        hair: "#DADCD6",
        action: "#2450E8",
        pass: "#3F8F5F",
        warn: "#C97A1A",
        fail: "#C4432E",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
