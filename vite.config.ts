import { createReadStream, readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Basis Universal transcoder of three, needed by KTX2Loader (src/scene/loaders.ts)
// for textures compressed by tools/optimize_glb.mjs. Served from node_modules in
// development and copied to basis/ in the build : no duplicate in the repository,
// always the version matching three.
function basisTranscoder(): Plugin {
  const dir = "node_modules/three/examples/jsm/libs/basis";
  const files = ["basis_transcoder.js", "basis_transcoder.wasm"];
  return {
    name: "basis-transcoder",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const file = files.find((name) => req.url?.split("?")[0].endsWith(`/basis/${name}`));
        if (!file) return next();
        res.setHeader("Content-Type", file.endsWith(".wasm") ? "application/wasm" : "text/javascript");
        createReadStream(join(dir, file)).pipe(res);
      });
    },
    generateBundle() {
      for (const name of files)
        this.emitFile({ type: "asset", fileName: `basis/${name}`, source: readFileSync(join(dir, name)) });
    },
  };
}

export default defineConfig({
  plugins: [react(), basisTranscoder()],
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
