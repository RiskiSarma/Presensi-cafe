import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAF9F6",
        surface: "#FFFFFF",
        border: "#E7E2DB",
        ink: "#24211D",
        muted: "#6B6459",
        espresso: {
          DEFAULT: "#C9971F",
          soft: "#F6EAC7",
          dark: "#8A6B1F",
          light: "#E3BE72",
        },
        forest: {
          DEFAULT: "#38492F",
          soft: "#E4E9D9",
          dark: "#212B1B",
          light: "#7C8F6C",
        },
        latte: "#EFDCA8",
        cream: "#FFFBF2",
        kiosk: {
          bg: "#1C2118",
          surface: "#262E20",
          border: "#3C4A32",
          text: "#F4F1E4",
        },
        success: { DEFAULT: "#3F7D5C", soft: "#E4F0EA" },
        warning: { DEFAULT: "#C9971F", soft: "#F6EAC7" },
        danger: { DEFAULT: "#A6402B", soft: "#F4E1DC" },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "20px",
        blob: "68% 32% 58% 42% / 48% 40% 60% 52%",
      },
      boxShadow: {
        warm: "0 4px 20px -4px rgba(56, 73, 47, 0.16)",
        "warm-lg": "0 14px 44px -8px rgba(56, 73, 47, 0.24)",
      },
      backgroundImage: {
        "espresso-gradient": "linear-gradient(135deg, #D9A93B 0%, #A9791F 100%)",
        "forest-gradient": "linear-gradient(135deg, #4A5F3D 0%, #212B1B 100%)",
        "bistro-gradient": "linear-gradient(135deg, #D9A93B 0%, #38492F 100%)",
        "cream-gradient": "linear-gradient(180deg, #FFFBF2 0%, #FAF6EA 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
