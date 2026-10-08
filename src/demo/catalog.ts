import { Color, MeshStandardMaterial } from "three";
import type { MaterialFinish } from "../minitel/MinitelModel";
import type { ModelProfile } from "../minitel/types";
import { suppliedProfile, televisionProfile } from "../minitel/profiles";
import { marbleTexture } from "./marble";
import { assetUrl } from "../assets";

export interface ModelCredit {
  title: string;
  author: string;
  source: string;
  license: string;
  licenseUrl: string;
  changes: string;
}

export interface ModelEntry {
  id: string;
  /** Short label for the switcher. */
  label: string;
  series: string;
  title: string;
  subtitle: string;
  /** Tagline under the brand. */
  tagline: string;
  file: string;
  profile: ModelProfile;
  finish?: MaterialFinish;
  /** Shown on the side table (desk terminals) or standing on the floor. */
  onTable: boolean;
  credit: ModelCredit;
}

const okotaru: ModelCredit = {
  title: "Minitel 1982-France",
  author: "okotaru",
  source:
    "https://sketchfab.com/3d-models/minitel-1982-france-864f54ce4e1f41abab0688b88a45babf",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  changes: "copie adaptee",
};

const charcoal = new Color("#3b3733");

// Interpretation of the Telic Alcatel Terminatel 255 finish on the Minitel 1
// geometry: black marble shell, charcoal keys. The shape stays a Minitel 1.
const terminatelFinish: MaterialFinish = (_mesh, material, role) => {
  if (!(material instanceof MeshStandardMaterial)) return;
  if (role === "key") {
    material.color.copy(charcoal);
    material.roughness = 0.55;
    return;
  }
  material.map = marbleTexture();
  material.color.set("#ffffff");
  // Matte plastic : the marble reads through soft highlights, not a varnish.
  material.roughness = 0.68;
  material.metalness = 0;
  material.needsUpdate = true;
};


export const catalog: ModelEntry[] = [
  {
    id: "terminatel-255",
    label: "Terminatel 255",
    series: "01 / SERIE LIMITEE",
    title: "Terminatel 255",
    subtitle: "Finition marbre noir · interpretation",
    tagline: "TELIC ALCATEL / MARBRE NOIR",
    file: assetUrl("models/minitel.glb"),
    profile: suppliedProfile,
    finish: terminatelFinish,
    onTable: true,
    credit: { ...okotaru, changes: "copie adaptee, finition marbre procedurale" },
  },
  {
    id: "minitel-1",
    label: "Minitel 1",
    series: "02 / TERMINAL VIDEOTEX",
    title: "Minitel 1",
    subtitle: "Alcatel · collection numerique",
    tagline: "FRANCE / 1982",
    file: assetUrl("models/minitel.glb"),
    profile: suppliedProfile,
    onTable: true,
    credit: okotaru,
  },
  {
    id: "televiseur-1950",
    label: "Televiseur 1950",
    series: "03 / RECEPTEUR CATHODIQUE",
    title: "Televiseur 1950",
    subtitle: "Meuble a pieds compas · ecran Videotex",
    tagline: "TUBE CATHODIQUE / 1950",
    file: assetUrl("models/television-1950.glb"),
    profile: televisionProfile,
    onTable: false,
    credit: {
      title: "1950's Retro Television",
      author: "Huuxloc",
      source:
        "https://sketchfab.com/3d-models/1950s-retro-television-640b18f7fcbb489eb47bda1927e5b653",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      changes: "copie adaptee",
    },
  },
];

export const defaultEntry = catalog[0];

export function findEntry(id: string | null): ModelEntry {
  return catalog.find((entry) => entry.id === id) ?? defaultEntry;
}

export const tableCredit: ModelCredit = {
  title: "Wood Drawer & Tables Set",
  author: "brandon_grey",
  source:
    "https://sketchfab.com/3d-models/wood-drawer-tables-set-958db224ef514b2eabd69ac0a4e59ca0",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  changes: "table d'appoint extraite, textures JPEG",
};
