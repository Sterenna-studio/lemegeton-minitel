import type { ColorIndex } from "./palette";
export const COLS = 40;
export const ROWS = 25;
export interface Cell {
  char: string;
  fg: ColorIndex;
  bg: ColorIndex;
  blink?: boolean;
  mosaic?: number;
}
export interface TerminalAction {
  key: string;
  label: string;
  target: string;
}
export interface TerminalFrame {
  title: string;
  cells: Cell[];
  actions: TerminalAction[];
  cursor?: { x: number; y: number };
  status: string;
}
export function createScreen(
  title: string,
  status = "CONNECTE",
): TerminalFrame {
  return {
    title,
    status,
    cells: Array.from({ length: COLS * ROWS }, () => ({
      char: " ",
      fg: 7,
      bg: 0,
    })),
    actions: [],
  };
}
export function text(
  screen: TerminalFrame,
  x: number,
  y: number,
  value: string,
  fg: ColorIndex = 7,
  blink = false,
): void {
  if (y < 0 || y >= ROWS) return;
  Array.from(value).forEach((char, offset) => {
    const column = x + offset;
    if (column >= 0 && column < COLS)
      screen.cells[y * COLS + column] = { char, fg, bg: 0, blink };
  });
}
export function plainText(screen: TerminalFrame): string {
  return Array.from({ length: ROWS }, (_, y) =>
    screen.cells
      .slice(y * COLS, (y + 1) * COLS)
      .map((cell) => (cell.mosaic !== undefined ? "#" : cell.char))
      .join("")
      .trimEnd(),
  )
    .join("\n")
    .trim();
}
