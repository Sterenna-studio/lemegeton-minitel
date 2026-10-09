import { tableCredit, type ModelCredit, type ModelEntry } from "../demo/catalog";
import type { Furniture } from "../scene/furniture";

// Credits shown in the 3D+ mode for what is on screen (docs/ASSETS.md,
// public/models/ATTRIBUTION.md). CC BY assets must be credited visibly ; the
// CC0 ones are credited too, for traceability. The decor of the rooms is
// built in code and credits no one.

const CC0 = { license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" };

export const doorCredit: ModelCredit = {
  title: "Door_Wooden_Old",
  author: "Mehdi Shahsavan",
  source: "https://sketchfab.com/3d-models/door-wooden-old-9mb-77815b3a55504037aa4641eb9650e9de",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  changes: "porte temporelle provisoire",
};

export const clocksCredit: ModelCredit = {
  title: "Mantel Clock 01, Vintage Grandfather Clock 01",
  author: "Poly Haven",
  source: "https://polyhaven.com/models",
  ...CC0,
  changes: "pendule simplifiee",
};

export const texturesCredit: ModelCredit = {
  title: "Dark Paneled Wood, Decrepit Wallpaper, Herringbone Parquet",
  author: "Poly Haven",
  source: "https://polyhaven.com/textures",
  ...CC0,
  changes: "textures KTX2",
};

/** What a place shows : the corridor, or a room with its terminal and furniture. */
export function creditsFor(place: string, entry?: ModelEntry, piece?: Furniture): ModelCredit[] {
  if (place === "couloir") return [doorCredit, clocksCredit, texturesCredit];
  const credits: ModelCredit[] = [];
  if (entry) credits.push(entry.credit);
  if (entry?.onTable && piece?.file) credits.push(tableCredit);
  // Every room has its door back to the corridor (with the mantel clock).
  credits.push(doorCredit, clocksCredit);
  // The 1950 living room is panelled with the corridor's textures.
  if (entry?.id === "televiseur-1950") credits.push(texturesCredit);
  return credits;
}
