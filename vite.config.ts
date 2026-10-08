import { createHash } from "node:crypto";
import { createReadStream, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Fingerprint of every file of public/ (src/assets.ts appends it as ?v=) : a
// replaced model or image gets a new address, so no cache serves the old one.
// Computed when the config loads : restart the dev server after replacing a file.
function assetVersions(): Record<string, string> {
  const root = "public";
  const versions: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else
        versions[relative(root, path).split(sep).join("/")] = createHash("sha256")
          .update(readFileSync(path))
          .digest("hex")
          .slice(0, 10);
    }
  };
  walk(root);
  return versions;
}

// three's revision ("180") : the transcoder lives in basis/<revision>/, a new
// folder whenever three is upgraded (KTX2Loader takes a folder, no query string).
const threeRevision = JSON.parse(readFileSync("node_modules/three/package.json", "utf8")).version.split(".")[1];

// Basis Universal transcoder of three, needed by KTX2Loader (src/scene/loaders.ts)
// for textures compressed by tools/optimize_glb.mjs. Served from node_modules in
// development and copied to basis/<revision>/ in the build : no duplicate in the
// repository, always the version matching three.
function basisTranscoder(): Plugin {
  const dir = "node_modules/three/examples/jsm/libs/basis";
  const files = ["basis_transcoder.js", "basis_transcoder.wasm"];
  return {
    name: "basis-transcoder",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const file = files.find((name) => req.url?.split("?")[0].endsWith(`/basis/${threeRevision}/${name}`));
        if (!file) return next();
        res.setHeader("Content-Type", file.endsWith(".wasm") ? "application/wasm" : "text/javascript");
        createReadStream(join(dir, file)).pipe(res);
      });
    },
    generateBundle() {
      for (const name of files)
        this.emitFile({ type: "asset", fileName: `basis/${threeRevision}/${name}`, source: readFileSync(join(dir, name)) });
    },
  };
}

export default defineConfig({
  plugins: [react(), basisTranscoder()],
  define: { __ASSET_VERSIONS__: JSON.stringify(assetVersions()) },
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
        parcours: "parcours/index.html",
      },
    },
  },
});
