/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        "custom-dark": {
          primary: "#1d4ed8",
          secondary: "#0369a1",
          accent: "#22c55e",
          neutral: "#f3f4f6",
          "base-100": "#242e45",
          info: "#3ABFF8",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
        },
        "custom-light": {
          primary: "#1d4ed8",
          secondary: "#0369a1",
          accent: "#22c55e",
          neutral: "#111827",
          "base-100": "#f3f4f6",
          info: "#3ABFF8",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
        },
      },
    ],
  },
};
