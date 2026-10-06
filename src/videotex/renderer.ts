import { COLS, ROWS, type TerminalFrame } from "./screen";
import { palette } from "./palette";
import { drawMosaic } from "./charset";
export interface CrtEffects {
  scanlines: boolean;
  vignette: boolean;
  glow: boolean;
  flicker: boolean;
  curvature: boolean;
}
export const defaultEffects: CrtEffects = {
  scanlines: true,
  vignette: true,
  glow: true,
  flicker: false,
  curvature: true,
};
export const WIDTH = 800;
export const HEIGHT = 600;
export function renderTerminal(
  ctx: CanvasRenderingContext2D,
  screen: TerminalFrame,
  effects: CrtEffects,
  time: number,
  reducedMotion: boolean,
): void {
  const cw = WIDTH / COLS;
  const ch = HEIGHT / ROWS;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const visible = reducedMotion || Math.floor(time / 600) % 2 === 0;
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  screen.cells.forEach((cell, index) => {
    const x = (index % COLS) * cw;
    const y = Math.floor(index / COLS) * ch;
    ctx.shadowBlur = 0;
    ctx.fillStyle = palette[cell.bg];
    ctx.fillRect(x, y, cw, ch);
    if (cell.blink && !visible) return;
    ctx.fillStyle = palette[cell.fg];
    ctx.shadowColor = palette[cell.fg];
    ctx.shadowBlur = effects.glow ? 2 : 0;
    if (cell.mosaic !== undefined) drawMosaic(ctx, cell.mosaic, x, y, cw, ch);
    else ctx.fillText(cell.char, x + cw / 2, y + ch / 2);
  });
  ctx.shadowBlur = 0;
  if (screen.cursor && visible) {
    ctx.fillStyle = palette[2];
    ctx.fillRect(
      screen.cursor.x * cw,
      screen.cursor.y * ch + ch - 5,
      cw - 2,
      3,
    );
  }
  if (effects.scanlines) {
    ctx.fillStyle = "rgba(0,0,0,.13)";
    for (let y = 0; y < HEIGHT; y += 3) ctx.fillRect(0, y, WIDTH, 1);
  }
  if (effects.vignette) {
    const gradient = ctx.createRadialGradient(
      WIDTH / 2,
      HEIGHT / 2,
      HEIGHT * 0.25,
      WIDTH / 2,
      HEIGHT / 2,
      WIDTH * 0.7,
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,.38)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  if (effects.flicker && !reducedMotion) {
    ctx.fillStyle = `rgba(0,0,0,${0.015 + 0.01 * Math.sin(time * 0.008)})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}
