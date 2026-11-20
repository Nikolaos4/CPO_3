import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Бэкенд по умолчанию живёт на http://localhost:3000 (см. survey-backend/.env.example).
// Запросы /api/* проксируем на него, поэтому в браузере нет проблем с CORS.
const BACKEND = process.env.VITE_BACKEND_URL || "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // этот origin разрешён в CORS_ORIGINS бэкенда
    proxy: {
      "/api": { target: BACKEND, changeOrigin: true },
      "/health": { target: BACKEND, changeOrigin: true },
    },
  },
});
