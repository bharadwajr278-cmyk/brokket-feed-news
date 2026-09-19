import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "admin",
  plugins: [react()],
  server: {
    port: 4173,
    proxy: {
      "/api": {
        target: "https://www.brokket.app",
        changeOrigin: true,
        secure: true,
      },
      "/admin/api": {
        target: "https://www.brokket.app",
        changeOrigin: true,
        secure: true,
      },
    },
    fs: { allow: [".."] },
  },
  build: {
    outDir: "../dist/admin",
    emptyOutDir: true,
  },
});
