// Optimise un modèle pour le Web (docs/MONDE_EXPLORABLE.md, §8) : nettoyage,
// textures redimensionnées puis compressées en KTX2 (Basis Universal),
// géométrie compressée en meshopt. Générique : la préparation propre à un
// asset (échelle 1 m = 8 unités, pivots, noms) reste dans tools/prepare_*.
//
// Usage :
//   node tools/optimize_glb.mjs <entrée.gltf|glb> <sortie.glb> [options]
//     --max <px>        taille max des textures de couleur (défaut 1024)
//     --secondary <px>  taille max des autres cartes (défaut 512)
//     --drop <a,b>      nœuds à retirer avec leurs enfants (par nom)
//     --no-ktx2         garde les textures en PNG/JPEG (redimensionnées)
//     --no-meshopt      garde la géométrie en flottants, non compressée
//     --scale <s>       met tout le modèle à l'échelle (ex. 8 : mètres → unités)
//     --simplify <r>    garde environ r (0-1) des sommets, erreur bornée à 1 %
//     --data-uastc      cartes de données (métal/rugosité, occlusion) en UASTC :
//                       plus lourd, mais sans blocs ; nécessaire quand le métal
//                       change brusquement (cadran d'horloge : damier en ETC1S)
//
// Côté application, un GLB optimisé demande KTX2Loader (KHR_texture_basisu)
// et le décodeur meshopt (EXT_meshopt_compression) au chargement.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, meshopt, prune, simplify, textureCompress, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { ktx2 } from "ktx2-encoder/gltf-transform";
import sharp from "sharp";
import { statSync } from "node:fs";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const [input, output] = args.filter((arg, i) => !arg.startsWith("--") && !args[i - 1]?.match(/^--(max|secondary|drop|scale|simplify)$/));
if (!input || !output) {
  console.error("usage : node tools/optimize_glb.mjs <entrée> <sortie.glb> [--max 1024] [--secondary 512] [--drop a,b] [--no-ktx2] [--no-meshopt]");
  process.exit(1);
}
const max = Number(option("--max", 1024));
const secondary = Number(option("--secondary", 512));
const drop = (option("--drop", "") || "").split(",").filter(Boolean);
const useKtx2 = !args.includes("--no-ktx2");
const useMeshopt = !args.includes("--no-meshopt");
const scale = Number(option("--scale", 1));
const simplifyRatio = option("--simplify", null);
const dataUastc = args.includes("--data-uastc");

// Keep every vertex attribute : prune would drop the UV of meshes whose
// material has no texture, such as the terminal screens, whose image is drawn
// by a shader at run time.
const keep = { keepAttributes: true };

const COLOR = /baseColor|emissive/;
const NORMAL = /normal/;
const DATA = /metallicRoughness|occlusion|specular|clearcoat|sheen|transmission|thickness/;

async function imageDecoder(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), width: info.width, height: info.height };
}

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });
const document = await io.read(input);
const root = document.getRoot();

function disposeTree(node) {
  for (const child of node.listChildren()) disposeTree(child);
  node.dispose();
}
for (const name of drop) {
  const nodes = root.listNodes().filter((node) => node.getName() === name);
  if (!nodes.length) console.warn(`--drop : aucun nœud « ${name} »`);
  nodes.forEach(disposeTree);
}

// Weight before : geometry buffers + images, whatever the input format.
const imageBytes = () => root.listTextures().reduce((sum, t) => sum + (t.getImage()?.byteLength ?? 0), 0);
if (scale !== 1) {
  // One parent node carries the scale : the pivots of the animated nodes stay.
  for (const scene of root.listScenes()) {
    const wrapper = document.createNode("echelle").setScale([scale, scale, scale]);
    for (const child of scene.listChildren()) {
      scene.removeChild(child);
      wrapper.addChild(child);
    }
    scene.addChild(wrapper);
  }
}

const before = {
  textures: root.listTextures().length,
  images: imageBytes(),
  bytes: imageBytes() + root.listAccessors().reduce((sum, a) => sum + (a.getArray()?.byteLength ?? 0), 0),
};

await MeshoptSimplifier.ready;
await document.transform(
  prune(keep),
  dedup(),
  ...(simplifyRatio === null
    ? []
    : [weld(), simplify({ simplifier: MeshoptSimplifier, ratio: Number(simplifyRatio), error: 0.01 })]),
  // Same format, smaller : colour maps up to --max, the others up to --secondary.
  textureCompress({ encoder: sharp, resize: [max, max], slots: COLOR }),
  textureCompress({ encoder: sharp, resize: [secondary, secondary], slots: new RegExp(`${NORMAL.source}|${DATA.source}`) }),
);
if (useKtx2)
  await document.transform(
    // Colour : ETC1S, perceptual, sRGB.
    ktx2({ slots: COLOR, isUASTC: false, qualityLevel: 160, isPerceptual: true, isSetKTX2SRGBTransferFunc: true, generateMipmap: true, imageDecoder, enableDebug: false }),
    // Normal maps : UASTC, linear, normal-map tuning, Zstandard.
    // RDO trades a little precision for much better Zstandard compression.
    ktx2({ slots: NORMAL, isUASTC: true, isNormalMap: true, isPerceptual: false, needSupercompression: true, enableRDO: true, rdoQualityLevel: 2, generateMipmap: true, imageDecoder, enableDebug: false }),
    // Other data maps : ETC1S, linear ; UASTC with --data-uastc.
    ktx2(
      dataUastc
        ? { slots: DATA, isUASTC: true, isPerceptual: false, needSupercompression: true, enableRDO: true, rdoQualityLevel: 2, generateMipmap: true, imageDecoder, enableDebug: false }
        : { slots: DATA, isUASTC: false, qualityLevel: 160, isPerceptual: false, generateMipmap: true, imageDecoder, enableDebug: false },
    ),
  );
await document.transform(prune(keep), ...(useMeshopt ? [meshopt({ encoder: MeshoptEncoder, level: "medium" })] : []));
await io.write(output, document);

const after = statSync(output).size;
console.log(`${input}\n  → ${output}`);
console.log(`  ${(before.bytes / 1e6).toFixed(2)} Mo (géométrie + images) → ${(after / 1e6).toFixed(2)} Mo (GLB)`);
console.log(`  textures : ${before.textures} (${(before.images / 1e6).toFixed(2)} Mo) → ${root.listTextures().length} (${(imageBytes() / 1e6).toFixed(2)} Mo)`);
for (const texture of root.listTextures())
  console.log(`    ${texture.getName() || texture.getURI() || "?"} : ${texture.getMimeType()} ${texture.getSize()?.join("×") ?? ""} ${(texture.getImage()?.byteLength / 1024).toFixed(0)} Ko`);
console.log(`  nœuds : ${root.listNodes().map((n) => n.getName()).join(", ")}`);
