import type { ColorIndex } from "./palette";
import { COLS, ROWS, type TerminalFrame } from "./screen";

// Bridge with the Videotex libraries of minitel-face (src/libs/*.js), which
// describe regions as rows [row, col, colour, G1 bytes] for a real Minitel.
// The same rows can be painted here on the 40 x 25 grid of the renderer.

/** Videotex colour names, in their ESC 0x40-0x47 order. */
export const VIDEOTEX_COLORS = {
  NOIR: 0,
  ROUGE: 1,
  VERT: 2,
  JAUNE: 3,
  BLEU: 4,
  MAGENTA: 5,
  CYAN: 6,
  BLANC: 7,
} as const satisfies Record<string, ColorIndex>;
export type VideotexColor = keyof typeof VIDEOTEX_COLORS;

/** [row 1-24, column 1-40, colour, G1 mosaic bytes 0x20-0x7F] */
export type RowPatch = [number, number, VideotexColor, number[]];

/**
 * G1 mosaic byte to the 6-bit pattern of drawMosaic. In G1, bits 0x01-0x10
 * are the first five sextants, 0x40 the bottom-right one ; 0x20 is always set.
 */
export function g1ToMosaic(byte: number): number {
  return (byte & 0x1f) | ((byte & 0x40) >> 1);
}

/** Paints rows on a frame (row 0 is the status line, like on the Minitel). */
export function paintRows(frame: TerminalFrame, rows: RowPatch[]): void {
  for (const [row, col, color, bytes] of rows)
    bytes.forEach((byte, offset) => {
      const x = col - 1 + offset;
      if (row < 0 || row >= ROWS || x < 0 || x >= COLS) return;
      const mosaic = g1ToMosaic(byte);
      frame.cells[row * COLS + x] = mosaic
        ? { char: " ", fg: VIDEOTEX_COLORS[color], bg: 0, mosaic }
        : { char: " ", fg: 7, bg: 0 };
    });
}
