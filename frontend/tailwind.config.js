/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ss: {
          body: "#123a33",
          navbar: "#061915",
          "navbar-border": "#2d6f61",
          bg: "#001f17",
          "bg-soft": "#06392d",
          surface: "#00493a",
          "surface-soft": "#0b5d4a",
          "surface-raised": "#126d58",
          accent: "#00a385",
          "accent-bright": "#21c7a5",
          "accent-soft": "#58d4bc",
          highlight: "#d7d7a8",
          "highlight-soft": "#e7e7c6",
          text: "#edf5f0",
          muted: "#8cb6ab",
          "neutral-100": "#f4f7f5",
          "neutral-200": "#dfe8e3",
          "neutral-300": "#c2d2cb",
          "neutral-400": "#a6bbb4",
          "neutral-500": "#8ca39b",
          border: "#116556",
          danger: "#d16666",
          success: "#49b48f",
        },
      },
      fontFamily: {
        sans: [
          "Manrope",
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0, 31, 23, 0.2)",
        focus: "0 0 0 3px rgba(0, 163, 133, 0.35)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      spacing: {
        18: "4.5rem",
      },
    },
  },
  plugins: [],
};
