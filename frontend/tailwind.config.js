/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base
        bg: "#0B0F14",
        surface: "#101722",
        surfaceHover: "#152032",
        border: "#223047",

        // Text
        text: "#E8EEF7",
        muted: "#A7B1C2",
        muted2: "#77839A",

        // Brand (Shopee)
        brand: "#EE4D2D",
        brandHover: "#FF5A3A",

        // Feedback
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#38BDF8",
      },

      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
      },

      keyframes: {
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        fade: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },

      animation: {
        "slide-in-right": "slide-in-right 0.3s ease-out",
        fade: "fade 0.2s ease-in-out",
      },
    },
  },
  plugins: [],
};
