import { COLS } from "./screen";
import { g1ToMosaic, type RowPatch, type VideotexColor } from "./mosaic";

// Agrandissement de rangees Videotex. Le Minitel n'a pas de zoom : on passe a
// la grille des sextants (2 x 3 par cellule, 80 x 75 pour l'ecran), on met a
// l'echelle au plus proche voisin, puis on regroupe en cellules mosaiques.

/** Cadre de reference en sextants : la mise a l'echelle part toujours de lui. */
export interface SextantBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const WIDTH = COLS * 2;

function rasterize(rows: RowPatch[]) {
  const pixels = new Map<string, VideotexColor>();
  for (const [row, col, color, bytes] of rows)
    bytes.forEach((byte, offset) => {
      const bits = g1ToMosaic(byte);
      for (let bit = 0; bit < 6; bit++)
        if (bits & (1 << bit))
          pixels.set(`${(col - 1 + offset) * 2 + (bit % 2)},${row * 3 + Math.floor(bit / 2)}`, color);
    });
  return pixels;
}

export function sextantBounds(rows: RowPatch[]): SextantBox {
  const box = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  for (const key of rasterize(rows).keys()) {
    const [x, y] = key.split(",").map(Number);
    box.minX = Math.min(box.minX, x);
    box.maxX = Math.max(box.maxX, x);
    box.minY = Math.min(box.minY, y);
    box.maxY = Math.max(box.maxY, y);
  }
  return box;
}

/** Plus grand facteur qui garde le cadre dans l'ecran, lignes 1 a lastRow comprises. */
export function maxScale(reference: SextantBox, lastRow: number): number {
  const width = reference.maxX - reference.minX + 1;
  const height = reference.maxY - reference.minY + 1;
  const cy = (reference.minY + reference.maxY + 1) / 2;
  const room = Math.min(cy - 3, (lastRow + 1) * 3 - cy);
  return Math.min(WIDTH / width, (2 * room) / height);
}

/**
 * Met des rangees a l'echelle `factor` autour du centre du cadre de reference,
 * recentre horizontalement sur l'ecran (decalage par cellules entieres, pour
 * qu'a x1 le dessin d'origine reste identique). Les cellules hors des lignes
 * 1..lastRow ou des 40 colonnes sont coupees.
 */
export function scaleRows(rows: RowPatch[], factor: number, reference: SextantBox, lastRow: number): RowPatch[] {
  const source = rasterize(rows);
  if (!source.size) return [];
  const cx = (reference.minX + reference.maxX + 1) / 2;
  const cy = (reference.minY + reference.maxY + 1) / 2;
  const tx = cx + Math.trunc((WIDTH / 2 - cx) / 2) * 2;
  const own = sextantBounds(rows);
  const map = (v: number, c: number, t: number) => t + (v - c) * factor;
  const x0 = Math.floor(map(own.minX, cx, tx));
  const x1 = Math.ceil(map(own.maxX + 1, cx, tx));
  const y0 = Math.floor(map(own.minY, cy, cy));
  const y1 = Math.ceil(map(own.maxY + 1, cy, cy));
  const cells = new Map<string, { bits: number; color: VideotexColor }>();
  for (let y = Math.max(3, y0); y < Math.min((lastRow + 1) * 3, y1); y++)
    for (let x = Math.max(0, x0); x < Math.min(WIDTH, x1); x++) {
      const sx = Math.floor(cx + (x + 0.5 - tx) / factor);
      const sy = Math.floor(cy + (y + 0.5 - cy) / factor);
      const color = source.get(`${sx},${sy}`);
      if (!color) continue;
      const key = `${Math.floor(y / 3)},${x >> 1}`;
      const cell = cells.get(key) ?? { bits: 0, color };
      cell.bits |= 1 << ((y % 3) * 2 + (x % 2));
      cells.set(key, cell);
    }
  return [...cells.entries()].map(([key, { bits, color }]) => {
    const [row, col] = key.split(",").map(Number);
    // Inverse de g1ToMosaic : bit 5 du sextant -> 0x40, et 0x20 toujours present.
    const byte = 0x20 | (bits & 0x1f) | ((bits & 0x20) << 1);
    return [row, col + 1, color, [byte]] as RowPatch;
  });
}
