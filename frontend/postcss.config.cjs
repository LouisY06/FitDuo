// PostCSS config for Vite + Tailwind.
// Use CommonJS export so PostCSS/Vite reliably pick it up in all environments.
module.exports = {
  plugins: {
    // Enable Tailwind so all `className` utilities (e.g. on ProfileScreen / battle UI)
    // are actually generated and applied.
    tailwindcss: {},
    autoprefixer: {},
  },
};

