import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true },
  // Two pages : the 3D terminal and the documentation (documentation/).
  build: {
    rollupOptions: {
      input: { main: "index.html", documentation: "documentation/index.html" },
    },
  },
});
