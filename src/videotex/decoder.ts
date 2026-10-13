import type { ColorIndex } from "./palette";
import { COLS, ROWS, type Cell } from "./screen";
import { g1ToMosaic } from "./mosaic";

// Decoder of Minitel Videotex streams (.vdt files, as a Minitel 1 receives
// them) to the 40 x 25 grid of the renderer. It covers what pages of the time
// use : cursor moves and US positioning, G0 text with the G2 accents (SS2, or SYN),
// G1 mosaics (SO / SI), REP, colours, blink, inverse, underline / disjoint
// mosaics and double sizes, and the photographic Videotex of the photo
// terminals (ESC p headers, then a JPEG picture : RTE and AFP screens). DRCS
// (characters redefined by the service) are not drawn : their cells show a grey
// hatch. Protocol sequences (PRO1-3) are skipped.

const NUL = 0x00,
  BS = 0x08,
  HT = 0x09,
  LF = 0x0a,
  VT = 0x0b,
  FF = 0x0c,
  CR = 0x0d,
  SO = 0x0e,
  SI = 0x0f,
  REP = 0x12,
  SEP = 0x13,
  SYN = 0x16,
  CAN = 0x18,
  SS2 = 0x19,
  ESC = 0x1b,
  RS = 0x1e,
  US = 0x1f;

/** G2 characters (after SS2) that stand alone. */
const G2: Record<number, string> = {
  0x23: "£",
  0x24: "$",
  0x26: "#",
  0x27: "§",
  0x2c: "←",
  0x2d: "↑",
  0x2e: "→",
  0x2f: "↓",
  0x30: "°",
  0x31: "±",
  0x38: "÷",
  0x3c: "¼",
  0x3d: "½",
  0x3e: "¾",
  0x6a: "Œ",
  0x7a: "œ",
  0x7b: "ß",
};

/** G2 diacritics (after SS2), combined with the next letter. */
const DIACRITICS: Record<number, string> = {
  0x41: "̀",
  0x42: "́",
  0x43: "̂",
  0x48: "̈",
  0x4b: "̧",
};

/** Minitel G0 differs from ASCII on a few codes. */
const G0: Record<number, string> = { 0x5e: "↑", 0x5f: "_", 0x60: "─", 0x7b: "¦", 0x7c: "|", 0x7d: "¦", 0x7e: "‾" };

/** A picture of photographic Videotex, placed on the grid. */
export interface VideotexPhoto {
  /** Column 1-40 and row 0-24 of its top-left corner. */
  x: number;
  y: number;
  /** Size in columns and rows. */
  w: number;
  h: number;
  jpeg: Uint8Array;
}

/** A decoded screen : the grid and the pictures over it. */
export interface VideotexScreen {
  cells: Cell[];
  photos: VideotexPhoto[];
}

interface Attributes {
  fg: ColorIndex;
  bg: ColorIndex;
  blink: boolean;
  inverse: boolean;
  /** Underline in G0, disjoint mosaics in G1. */
  underline: boolean;
  w: 1 | 2;
  h: 1 | 2;
  g1: boolean;
}

const defaults = (): Attributes => ({ fg: 7, bg: 0, blink: false, inverse: false, underline: false, w: 1, h: 1, g1: false });

const blank = (): Cell => ({ char: " ", fg: 7, bg: 0 });

class Decoder {
  cells: Cell[] = Array.from({ length: COLS * ROWS }, blank);
  /** Row 0 is the status line ; rows 1-24 the page. Columns 1-40. */
  x = 1;
  y = 1;
  attrs = defaults();
  /** Last cell written, for REP. */
  last: Omit<Cell, "covered"> | null = null;
  /** Position before going to row 0 (LF there brings it back). */
  saved: [number, number] | null = null;
  drcs = { g0: false, g1: false };
  /** Something was drawn since the last clear. */
  drawn = false;
  photos: VideotexPhoto[] = [];
  /** Size announced by a picture header, for the picture that follows. */
  pending: Omit<VideotexPhoto, "jpeg"> | null = null;

  clear(): void {
    this.cells = Array.from({ length: COLS * ROWS }, blank);
    this.photos = [];
    this.pending = null;
    this.x = 1;
    this.y = 1;
    this.attrs = defaults();
    this.drawn = false;
  }

  move(x: number, y: number): void {
    this.x = Math.min(Math.max(x, 1), COLS);
    this.y = Math.min(Math.max(y, 0), ROWS - 1);
  }

  /** US positioning resets the attributes, like a new row on the Minitel. */
  position(row: number, col: number): void {
    if (row === 0 && this.y !== 0) this.saved = [this.x, this.y];
    this.move(col, row);
    this.attrs = defaults();
  }

  advance(): void {
    this.x += this.attrs.g1 ? 1 : this.attrs.w;
    if (this.x > COLS) {
      if (this.y === 0) {
        this.x = COLS;
        return;
      }
      this.x = 1;
      this.lineFeed();
    }
  }

  lineFeed(): void {
    if (this.y === 0) {
      const [x, y] = this.saved ?? [1, 1];
      this.move(x, y);
      this.saved = null;
      return;
    }
    this.y = this.y >= ROWS - 1 ? 1 : this.y + 1;
  }

  set(x: number, y: number, cell: Cell): void {
    if (x < 1 || x > COLS || y < 0 || y >= ROWS) return;
    this.cells[y * COLS + x - 1] = cell;
  }

  put(cell: Omit<Cell, "covered">): void {
    this.last = cell;
    this.drawn = true;
    const { x, y } = this;
    const w = cell.w ?? 1;
    const h = cell.h ?? 1;
    // Double height grows upwards from the cursor row : the glyph's top-left
    // cell holds it, the other cells it covers only keep the background.
    const top = h === 2 && y > 1 ? y - 1 : y;
    const glyph: Cell = { ...cell };
    if (top === y) delete glyph.h;
    if (w === 2 && x === COLS) delete glyph.w;
    this.set(x, top, glyph);
    for (let dy = 0; dy < (glyph.h ?? 1); dy++)
      for (let dx = 0; dx < (glyph.w ?? 1); dx++)
        if (dx || dy) this.set(x + dx, top + dy, { char: " ", fg: cell.fg, bg: cell.bg, covered: true });
    this.advance();
  }

  write(byte: number, g2?: string): void {
    const a = this.attrs;
    // In G1 every code is a mosaic : 0x40-0x5F draw like 0x60-0x7F (the Pinky
    // logo uses them along its diagonals).
    if (a.g1 && !g2) {
      if (this.drcs.g1) return this.put({ char: "▒", fg: a.fg, bg: a.bg });
      const cell: Omit<Cell, "covered"> = { char: " ", fg: a.fg, bg: a.bg, mosaic: g1ToMosaic(byte) };
      if (a.underline) cell.separated = true;
      if (a.blink) cell.blink = true;
      return this.put(cell);
    }
    let char = g2 ?? G0[byte] ?? String.fromCharCode(byte);
    if (!g2 && this.drcs.g0 && byte > 0x20) char = "▒";
    if (byte === 0x7f && !g2) {
      return this.put({ char: " ", fg: a.inverse ? a.bg : a.fg, bg: a.inverse ? a.fg : a.bg, mosaic: 63 });
    }
    const cell: Omit<Cell, "covered"> = {
      char,
      fg: a.inverse ? a.bg : a.fg,
      bg: a.inverse ? a.fg : a.bg,
    };
    if (a.blink) cell.blink = true;
    if (a.underline) cell.underline = true;
    if (a.w === 2) cell.w = 2;
    if (a.h === 2) cell.h = 2;
    this.put(cell);
  }

  repeat(count: number): void {
    const last = this.last;
    if (!last) return;
    for (let i = 0; i < count; i++) this.put({ ...last });
  }

  /** CAN : clears the end of the row, the cursor stays. */
  clearRow(): void {
    for (let x = this.x; x <= COLS; x++) this.set(x, this.y, blank());
  }

  escape(byte: number): void {
    const a = this.attrs;
    if (byte >= 0x40 && byte <= 0x47) a.fg = (byte - 0x40) as ColorIndex;
    else if (byte >= 0x50 && byte <= 0x57) a.bg = (byte - 0x50) as ColorIndex;
    else if (byte === 0x48) a.blink = true;
    else if (byte === 0x49) a.blink = false;
    else if (byte === 0x4c) [a.w, a.h] = [1, 1];
    else if (byte === 0x4d) [a.w, a.h] = [1, 2];
    else if (byte === 0x4e) [a.w, a.h] = [2, 1];
    else if (byte === 0x4f) [a.w, a.h] = [2, 2];
    else if (byte === 0x59) a.underline = false;
    else if (byte === 0x5a) a.underline = true;
    else if (byte === 0x5c) a.inverse = false;
    else if (byte === 0x5d) a.inverse = true;
  }

  /** CSI (ESC [) : the few cursor and erase commands of the Minitel. */
  csi(params: number[], final: number): void {
    const n = params[0] || 1;
    if (final === 0x41) this.move(this.x, this.y - n);
    else if (final === 0x42) this.move(this.x, this.y + n);
    else if (final === 0x43) this.move(this.x + n, this.y);
    else if (final === 0x44) this.move(this.x - n, this.y);
    else if (final === 0x48 || final === 0x66) this.move(params[1] || 1, params[0] || 1);
    else if (final === 0x4a) {
      const mode = params[0] ?? 0;
      const here = this.y * COLS + this.x - 1;
      for (let i = 0; i < this.cells.length; i++)
        if (mode === 2 || (mode === 0 && i >= here) || (mode === 1 && i <= here)) this.cells[i] = blank();
    } else if (final === 0x4b) {
      const mode = params[0] ?? 0;
      for (let x = 1; x <= COLS; x++)
        if (mode === 2 || (mode === 0 && x >= this.x) || (mode === 1 && x <= this.x)) this.set(x, this.y, blank());
    }
  }
}

const SOI = [0xff, 0xd8, 0xff];

function find(bytes: Uint8Array, pattern: number[], from: number, to = bytes.length): number {
  for (let i = from; i <= to - pattern.length; i++) if (pattern.every((value, k) => bytes[i + k] === value)) return i;
  return -1;
}

/**
 * A pair of values of a picture description header : 0x21 0x32 is the
 * position, 0x21 0x33 the size (width then height), in units of one row
 * (10 points), each as 0x42 <length> <integer> [<fraction / 128>].
 */
function photoValues(header: Uint8Array, attribute: number): [number, number] | null {
  const at = find(header, [0x21, attribute], 0);
  if (at < 0) return null;
  const values: number[] = [];
  let k = at + 2;
  while (values.length < 2 && header[k] === 0x42) {
    const length = header[k + 1];
    values.push(header[k + 2] + (length >= 2 ? header[k + 3] / 128 : 0));
    k += 2 + length;
  }
  return values.length === 2 ? [values[0], values[1]] : null;
}

/**
 * ESC p : a picture header (from `start`, after "ESC p"). Either a description
 * (its size, kept for the picture) or the data header just before a JPEG, which
 * is read whole : its bytes are never taken for Videotex codes. Returns the
 * offset to go on from.
 */
function photo(d: Decoder, bytes: Uint8Array, start: number): number {
  const nextEsc = bytes.indexOf(ESC, start);
  const end = nextEsc < 0 ? bytes.length : nextEsc;
  const soi = find(bytes, SOI, start, Math.min(bytes.length, end + 3));
  if (soi < 0) {
    const header = bytes.subarray(start, end);
    const size = photoValues(header, 0x33);
    // A Minitel cell is 8 x 10 points : one unit is 1.25 columns, one row.
    // The column comes from the header (text may follow the US positioning,
    // like the number of an AFP picture), the row from the cursor.
    const position = photoValues(header, 0x32);
    const x = position ? Math.round(position[0] * 1.25) + 1 : d.x;
    if (size) d.pending = { x, y: d.y, w: Math.min(size[0] * 1.25, COLS - x + 1), h: Math.min(size[1], ROWS - d.y) };
    return end;
  }
  const eoi = find(bytes, [0xff, 0xd9], soi + 2);
  const stop = eoi < 0 ? bytes.length : eoi + 2;
  const place = d.pending ?? { x: d.x, y: d.y, w: COLS - d.x + 1, h: ROWS - d.y };
  d.photos.push({ ...place, jpeg: bytes.slice(soi, stop) });
  d.pending = null;
  d.drawn = true;
  return stop;
}

function hasContent(cells: Cell[]): boolean {
  return cells.some((cell) => cell.mosaic || (cell.char !== " " && !cell.covered) || cell.bg !== 0);
}

/**
 * Runs a stream through the decoder. `onPage` gets each screen that is about
 * to be cleared by FF (or ends the stream), with the offset where it started.
 */
function run(bytes: Uint8Array, onPage: (screen: VideotexScreen, start: number) => void): void {
  const d = new Decoder();
  let start = 0;
  const flush = (end: number) => {
    if (d.drawn && (d.photos.length || hasContent(d.cells))) onPage({ cells: d.cells, photos: d.photos }, start);
    start = end;
  };
  let i = 0;
  const next = () => (i < bytes.length ? bytes[i++] : -1);
  while (i < bytes.length) {
    const byte = bytes[i++];
    if (byte >= 0x20) {
      d.write(byte);
      continue;
    }
    switch (byte) {
      case NUL:
        break;
      case BS:
        if (d.x > 1) d.x--;
        else if (d.y > 1) [d.x, d.y] = [COLS, d.y - 1];
        else [d.x, d.y] = [COLS, ROWS - 1];
        break;
      case HT:
        d.advance();
        break;
      case LF:
        d.lineFeed();
        break;
      case VT:
        if (d.y > 1) d.y--;
        else if (d.y === 1) d.y = ROWS - 1;
        break;
      case FF:
        flush(i - 1);
        d.clear();
        break;
      case CR:
        d.x = 1;
        break;
      case SO:
        d.attrs.g1 = true;
        break;
      case SI:
        d.attrs.g1 = false;
        break;
      case REP: {
        const count = next();
        if (count >= 0x40) d.repeat(count - 0x40);
        break;
      }
      case SEP:
        next();
        break;
      case CAN:
        d.clearRow();
        break;
      // Some services (the Pinky server) send their accents after SYN.
      case SYN:
      case SS2: {
        const code = next();
        if (DIACRITICS[code]) {
          const letter = next();
          if (letter >= 0x20) d.write(letter, (String.fromCharCode(letter) + DIACRITICS[code]).normalize("NFC"));
        } else if (G2[code]) d.write(code, G2[code]);
        break;
      }
      case ESC: {
        const code = next();
        if (code === 0x5b) {
          const params: number[] = [];
          let value = "";
          let c = next();
          while (c >= 0x30 && c <= 0x3f) {
            if (c === 0x3b) {
              params.push(Number(value || 0));
              value = "";
            } else value += String.fromCharCode(c);
            c = next();
          }
          if (value) params.push(Number(value));
          d.csi(params, c);
        } else if (code === 0x70) i = photo(d, bytes, i);
        else if (code === 0x39) next();
        else if (code === 0x3a) i += 2;
        else if (code === 0x3b) i += 3;
        else if (code === 0x23) i += 2;
        else if (code >= 0x28 && code <= 0x2b) {
          // Character set designation : DRCS ("SP B" / "SP C") or the normal set.
          const isDrcs = next() === 0x20;
          if (isDrcs) next();
          if (code === 0x28) d.drcs.g0 = isDrcs;
          if (code === 0x29) d.drcs.g1 = isDrcs;
        } else d.escape(code);
        break;
      }
      case RS:
        d.move(1, 1);
        d.attrs = defaults();
        break;
      case US: {
        const row = next();
        if (row === 0x23) {
          // DRCS download : skipped up to the next US.
          while (i < bytes.length && bytes[i] !== US) i++;
          break;
        }
        const col = next();
        if (row >= 0x40) d.position(row - 0x40, col - 0x40);
        else if (row >= 0x30 && row <= 0x39) {
          const r = (row - 0x30) * 10 + (col - 0x30);
          const c1 = next();
          const c2 = next();
          d.position(r, (c1 - 0x30) * 10 + (c2 - 0x30));
        }
        break;
      }
      default:
        break;
    }
  }
  flush(bytes.length);
}

/** Offsets where each screen of the stream starts (screens are cut at FF). */
export function videotexPages(bytes: Uint8Array): number[] {
  const starts: number[] = [];
  run(bytes, (_cells, start) => starts.push(start));
  return starts;
}

/** Decodes one stream, or the part of it from `start` to `end`, to the last screen drawn. */
export function decodeVideotexScreen(bytes: Uint8Array, start = 0, end = bytes.length): VideotexScreen {
  let screen: VideotexScreen = { cells: Array.from({ length: COLS * ROWS }, blank), photos: [] };
  run(bytes.subarray(start, end), (decoded) => (screen = decoded));
  return screen;
}

/** The grid only of decodeVideotexScreen. */
export function decodeVideotex(bytes: Uint8Array, start = 0, end = bytes.length): Cell[] {
  return decodeVideotexScreen(bytes, start, end).cells;
}
