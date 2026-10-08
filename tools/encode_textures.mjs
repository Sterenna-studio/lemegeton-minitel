// Encode les textures de matériaux du monde (Poly Haven, monde/05_TEXTURES/)
// en KTX2 pour le Web : couleur en ETC1S sRGB (1024 px), relief (normal map)
// et matière (ARM : occlusion, rugosité, métal) en UASTC linéaire (512 px),
// sans les blocs de l'ETC1S sur les cartes de données. Ces deux-là sont
// marquées linéaires : ktx2-encoder marque tout en sRGB par défaut.
//
// Usage : node tools/encode_textures.mjs [nom ...]
// Sortie : public/models/monde/textures/<nom>_{couleur,relief,matiere}.ktx2
import { encodeToKTX2 } from "ktx2-encoder";
import sharp from "sharp";
import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = "monde/05_TEXTURES";
const OUT = "public/models/monde/textures";
const names = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(SOURCE).filter((n) => statSync(join(SOURCE, n)).isDirectory());

async function imageDecoder(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), width: info.width, height: info.height };
}

const KINDS = [
  { suffix: "diff", out: "couleur", size: 1024, options: { isUASTC: false, qualityLevel: 180, isPerceptual: true, isSetKTX2SRGBTransferFunc: true } },
  { suffix: "nor_gl", out: "relief", size: 512, options: { isUASTC: true, isNormalMap: true, isPerceptual: false, isSetKTX2SRGBTransferFunc: false, needSupercompression: true, enableRDO: true, rdoQualityLevel: 2 } },
  { suffix: "arm", out: "matiere", size: 512, options: { isUASTC: true, isPerceptual: false, isSetKTX2SRGBTransferFunc: false, needSupercompression: true, enableRDO: true, rdoQualityLevel: 2 } },
];

mkdirSync(OUT, { recursive: true });
for (const name of names) {
  const files = readdirSync(join(SOURCE, name));
  for (const kind of KINDS) {
    const file = files.find((f) => f.includes(`_${kind.suffix}_`));
    if (!file) {
      console.warn(`${name} : pas de carte ${kind.suffix}`);
      continue;
    }
    const resized = await sharp(join(SOURCE, name, file)).resize(kind.size, kind.size, { fit: "fill" }).png().toBuffer();
    const ktx2 = await encodeToKTX2(new Uint8Array(resized), { ...kind.options, generateMipmap: true, imageDecoder, enableDebug: false });
    const target = join(OUT, `${name}_${kind.out}.ktx2`);
    writeFileSync(target, ktx2);
    console.log(`${target.split("\\").join("/")} : ${(ktx2.byteLength / 1024).toFixed(0)} Ko`);
  }
}
