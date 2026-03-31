import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        bg: "#F9FAFB",
        surface: {
          DEFAULT: "#FFFFFF",
          hover: "#FAFBFC",
        },
        border: {
          DEFAULT: "#E5E7EB",
          light: "#F0F1F3",
        },
        text: {
          DEFAULT: "#1A1A2E",
          secondary: "#64748B",
          muted: "#94A3B8",
        },
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          bg: "#EEF2FF",
        },
        green: {
          DEFAULT: "#059669",
          bg: "#ECFDF5",
        },
        amber: {
          DEFAULT: "#D97706",
          bg: "#FFFBEB",
        },
        red: {
          DEFAULT: "#DC2626",
          bg: "#FEF2F2",
        },
        purple: {
          DEFAULT: "#7C3AED",
          bg: "#F5F3FF",
        },
        hosmony: {
          1: "#94A3B8",
          2: "#3B82F6",
          3: "#059669",
          4: "#D97706",
          5: "#7C3AED",
        },
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        lg: "16px",
      },
      boxShadow: {
        DEFAULT: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        md: "0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        lg: "0 8px 24px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
