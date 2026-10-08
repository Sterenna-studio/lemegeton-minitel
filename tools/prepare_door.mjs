// Prépare la porte temporelle provisoire (docs/MONDE_EXPLORABLE.md, §5 et §10) :
// « Door_Wooden_Old » de Mehdi Shahsavan (CC BY 4.0), déposée dans
// monde/00_CORE/porte/. Garde la porte fermée (nœud « 01 »), retire la copie
// ouverte et la caméra Cinema 4D, met à l'échelle (1 m = 8 unités ; la source
// est en centimètres), pose le bas du cadre centré sur l'origine, la porte
// regardant +z, et nomme les pièces animées :
//   porte    racine
//   cadre    chambranle, fixe
//   battant  pivot sur l'axe des charnières (rotation autour de y)
//   poignee  enfant du battant, pivot sur son axe
// La compression se fait ensuite avec tools/optimize_glb.mjs.
//
// Usage : node tools/prepare_door.mjs [source.gltf] [sortie.glb]
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { getBounds, prune } from "@gltf-transform/functions";

const source = process.argv[2] ?? "monde/00_CORE/porte/door_wooden_old_-9mb/scene.gltf";
const output = process.argv[3] ?? "monde/00_CORE/porte/build/porte-preparee.glb";
const UNITS_PER_CM = 8 / 100;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const document = await io.read(source);
const root = document.getRoot();
const scene = root.getDefaultScene() ?? root.listScenes()[0];
const byName = (name) => {
  const node = root.listNodes().find((n) => n.getName() === name);
  if (!node) throw new Error(`nœud introuvable : ${name}`);
  return node;
};

const closed = byName("01");
// World matrix of the closed door, before detaching it from its ancestors.
const world = closed.getWorldMatrix();
const porte = document.createNode("porte");
for (const child of scene.listChildren()) scene.removeChild(child);
scene.addChild(porte);
closed.getParentNode()?.removeChild(closed);
porte.addChild(closed);
closed.setMatrix(world);
// The leftovers (open copy, camera, empty fbx wrappers) are no longer in the
// scene : prune drops them.
await document.transform(prune({ keepAttributes: true }));

byName("F").setName("cadre");
byName("door").setName("battant");
byName("handel").setName("poignee");

// Scale and place : bottom of the frame on y = 0, centred in x and z.
porte.setScale([UNITS_PER_CM, UNITS_PER_CM, UNITS_PER_CM]);
const box = getBounds(porte);
const centre = [(box.min[0] + box.max[0]) / 2, box.min[1], (box.min[2] + box.max[2]) / 2];
porte.setTranslation([-centre[0], -centre[1], -centre[2]]);
const final = getBounds(porte);
const size = final.max.map((v, i) => v - final.min[i]);

// Hinge axis of the leaf, in the door's frame, for the report.
const leaf = byName("battant");
const hinge = leaf.getWorldMatrix().slice(12, 15).map((v) => +v.toFixed(3));

await io.write(output, document);
console.log(`${source}\n  → ${output}`);
console.log(`  taille (unités) : ${size.map((v) => v.toFixed(2)).join(" × ")}  (${size.map((v) => (v / 8).toFixed(2)).join(" × ")} m)`);
console.log(`  axe des charnières (battant) : ${hinge.join(", ")}`);
console.log(`  nœuds : ${root.listNodes().map((n) => n.getName()).join(", ")}`);
