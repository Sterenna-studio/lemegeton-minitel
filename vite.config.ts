import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true },
  // Pages : the home (the simple version until the world lands, lot F), the
  // simple version (simple/), the documentation and the world's workshop.
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        simple: "simple/index.html",
        documentation: "documentation/index.html",
        atelier: "atelier/index.html",
      },
    },
  },
});
