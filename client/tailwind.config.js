/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "on-primary": "var(--on-primary)",
        "primary-container": "var(--primary-container)",
        "on-primary-container": "var(--on-primary-container)",
        secondary: "var(--secondary)",
        "on-secondary": "var(--on-secondary)",
        tertiary: "var(--tertiary)",
        background: "var(--background)",
        "on-background": "var(--on-background)",
        surface: "var(--surface)",
        "surface-dim": "var(--surface-dim)",
        "surface-bright": "var(--surface-bright)",
        "surface-container-lowest": "var(--surface-container-lowest)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-container": "var(--surface-container)",
        "surface-container-high": "var(--surface-container-high)",
        "surface-container-highest": "var(--surface-container-highest)",
        "on-surface": "var(--on-surface)",
        "on-surface-variant": "var(--on-surface-variant)",
        outline: "var(--outline)",
        "outline-variant": "var(--outline-variant)",
        
        // Theme specific helper / extra variables
        "on-primary-fixed-variant": "var(--on-primary-fixed-variant)",
        "on-tertiary-container": "var(--on-tertiary-container)",
        "secondary-fixed-dim": "var(--secondary-fixed-dim)",
        "on-primary-container": "var(--on-primary-container)",
        "primary-fixed-dim": "var(--primary-fixed-dim)",
        "primary-fixed": "var(--primary-fixed)",
        "on-tertiary-fixed": "var(--on-tertiary-fixed)",
        "surface-tint": "var(--surface-tint)",
        "tertiary-fixed-dim": "var(--tertiary-fixed-dim)",
        "on-tertiary-fixed-variant": "var(--on-tertiary-fixed-variant)",
        "surface-variant": "var(--surface-variant)",
        "error-container": "var(--error-container)",
        "tertiary-fixed": "var(--tertiary-fixed)",
        "secondary-fixed": "var(--secondary-fixed)",
        "on-secondary-fixed": "var(--on-secondary-fixed)",
        "inverse-on-surface": "var(--inverse-on-surface)",
        "on-tertiary": "var(--on-tertiary)",
        "on-error": "var(--on-error)",
        "on-primary-fixed": "var(--on-primary-fixed)",
        "on-secondary-fixed-variant": "var(--on-secondary-fixed-variant)",
        "inverse-primary": "var(--inverse-primary)",
        "on-secondary-container": "var(--on-secondary-container)",
        "on-error-container": "var(--on-error-container)",
        error: "var(--error)",
        "tertiary-container": "var(--tertiary-container)",
        "on-secondary": "var(--on-secondary)"
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: [],
}
