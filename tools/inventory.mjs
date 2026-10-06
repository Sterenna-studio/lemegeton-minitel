import { readdir, stat, readFile, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
// Usage: node tools/inventory.mjs <dossier de travail contenant 06_MODEL/>
const root = path.resolve(process.argv[2] ?? "assets-src");
const app = fileURLToPath(new URL("../", import.meta.url));
async function walk(folder) {
  const results = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) results.push(...(await walk(file)));
    else results.push(file);
  }
  return results;
}
async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}
const files = [];
for (const file of await walk(path.join(root, "06_MODEL"))) {
  const item = {
    path: path.relative(root, file).split(path.sep).join("/"),
    bytes: (await stat(file)).size,
    sha256: await sha256(file),
  };
  if (file.endsWith(".glb")) {
    const data = await readFile(file);
    const json = JSON.parse(
      data.subarray(20, 20 + data.readUInt32LE(12)).toString(),
    );
    item.gltf = {
      asset: json.asset,
      meshes: json.meshes?.length ?? 0,
      images: json.images?.length ?? 0,
      triangles: (json.meshes ?? [])
        .flatMap((m) => m.primitives)
        .reduce(
          (sum, p) =>
            sum +
            (p.mode === undefined || p.mode === 4
              ? json.accessors[p.indices ?? p.attributes.POSITION].count / 3
              : 0),
          0,
        ),
    };
  }
  files.push(item);
}
const report = {
  date: "2026-10-06",
  files,
  totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
};
await writeFile(
  path.join(app, "docs/asset-audit/inventory.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      files: files.length,
      totalBytes: report.totalBytes,
      glbs: files
        .filter((file) => file.gltf)
        .map((file) => ({ path: file.path, bytes: file.bytes, ...file.gltf })),
    },
    null,
    2,
  ),
);
