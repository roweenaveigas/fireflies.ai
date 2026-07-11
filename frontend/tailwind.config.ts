import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        canvas: "var(--ff-canvas)",
        ff: {
          purple: "var(--ff-purple)",
          "purple-hover": "var(--ff-purple-hover)",
          soft: "var(--ff-purple-soft)",
          muted: "var(--ff-purple-muted)",
          border: "var(--ff-border)",
          text: "var(--ff-text)",
          gray: "var(--ff-muted)",
          "gray-2": "var(--ff-muted-2)",
          sidebar: "var(--ff-sidebar)",
          bg: "var(--ff-bg)",
        },
        brand: {
          DEFAULT: "var(--ff-purple)",
          soft: "var(--ff-purple-soft)",
          dark: "var(--ff-purple-hover)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(31, 31, 46, 0.04)",
        "card-hover": "0 4px 14px rgba(108, 92, 231, 0.08)",
        soft: "0 2px 8px rgba(31, 31, 46, 0.06)",
      },
      borderRadius: {
        ff: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
