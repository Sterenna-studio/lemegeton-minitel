import { Color, MeshStandardMaterial } from "three";
import type { MaterialFinish } from "../minitel/MinitelModel";
import type { ModelProfile } from "../minitel/types";
import { suppliedProfile, televisionProfile } from "../minitel/profiles";
import { marbleTexture } from "./marble";

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
  material.roughness = 0.28;
  material.metalness = 0.05;
  material.needsUpdate = true;
};

const base = import.meta.env.BASE_URL;

export const catalog: ModelEntry[] = [
  {
    id: "terminatel-255",
    label: "Terminatel 255",
    series: "01 / SERIE LIMITEE",
    title: "Terminatel 255",
    subtitle: "Finition marbre noir · interpretation",
    tagline: "TELIC ALCATEL / MARBRE NOIR",
    file: `${base}models/minitel.glb`,
    profile: suppliedProfile,
    finish: terminatelFinish,
    credit: { ...okotaru, changes: "copie adaptee, finition marbre procedurale" },
  },
  {
    id: "minitel-1",
    label: "Minitel 1",
    series: "02 / TERMINAL VIDEOTEX",
    title: "Minitel 1",
    subtitle: "Alcatel · collection numerique",
    tagline: "FRANCE / 1982",
    file: `${base}models/minitel.glb`,
    profile: suppliedProfile,
    credit: okotaru,
  },
  {
    id: "televiseur-1950",
    label: "Televiseur 1950",
    series: "03 / RECEPTEUR CATHODIQUE",
    title: "Televiseur 1950",
    subtitle: "Meuble a pieds compas · ecran Videotex",
    tagline: "TUBE CATHODIQUE / 1950",
    file: `${base}models/television-1950.glb`,
    profile: televisionProfile,
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
