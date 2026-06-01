import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react({ tsconfig: "./tsconfig.frontend.json" }), tailwindcss()],
  root: ".",
  build: {
    outDir: "dist-frontend",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-router": ["react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-axios": ["axios"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./web"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target:
          process.env.VITE_API_URL ||
          "https://tienda-online-zped08s-projects.vercel.app",
        changeOrigin: true,
      },
    },
  },
});
