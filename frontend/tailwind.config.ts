import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#f20d33",
        "background-light": "#f5f5f5",
        "background-dark": "#181112",
        "primary-accent": "#FF4500",
        "gamification-accent": "#39FF14",
      },
      fontFamily: {
        display: ["var(--font-bebas-neue)", "var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-montserrat)", "var(--font-space-grotesk)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
