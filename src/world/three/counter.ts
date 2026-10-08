import type { Roller } from "../sequence";

// Roller counter of the temporal door, drawn on a canvas : cream digits on
// black (docs/DIRECTION_ARTISTIQUE.md), each roller turning upwards from its
// old face to the new one. The canvas becomes a texture on the door.

export const COUNTER_WIDTH = 512;
export const COUNTER_HEIGHT = 160;

export function drawCounter(ctx: CanvasRenderingContext2D, rollers: Roller[]) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = "#1b1712";
  ctx.fillRect(0, 0, width, height);
  const gap = 10;
  const cell = (width - gap * (rollers.length + 1)) / rollers.length;
  const top = 14;
  const h = height - top * 2;
  ctx.font = `500 ${Math.round(h * 0.72)}px "IBM Plex Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  rollers.forEach((roller, i) => {
    const x = gap + i * (cell + gap);
    // Drum : dark cylinder, lighter in the middle.
    const drum = ctx.createLinearGradient(0, top, 0, top + h);
    drum.addColorStop(0, "#050404");
    drum.addColorStop(0.5, "#191512");
    drum.addColorStop(1, "#050404");
    ctx.fillStyle = drum;
    ctx.fillRect(x, top, cell, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, top, cell, h);
    ctx.clip();
    const offset = roller.progress * h;
    ctx.fillStyle = "#ece4d2";
    ctx.fillText(roller.from, x + cell / 2, top + h / 2 - offset);
    ctx.fillText(roller.to, x + cell / 2, top + h / 2 + h - offset);
    ctx.restore();
    // Shading of the curvature, on top of the digits.
    const shade = ctx.createLinearGradient(0, top, 0, top + h);
    shade.addColorStop(0, "rgba(0,0,0,0.75)");
    shade.addColorStop(0.3, "rgba(0,0,0,0)");
    shade.addColorStop(0.7, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.fillStyle = shade;
    ctx.fillRect(x, top, cell, h);
  });
  // Brass window frame.
  ctx.strokeStyle = "#b08d57";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, width - 6, height - 6);
}

/** Engraved plate : the terminal's name. */
export function drawPlaque(ctx: CanvasRenderingContext2D, text: string) {
  const { width, height } = ctx.canvas;
  const brass = ctx.createLinearGradient(0, 0, 0, height);
  brass.addColorStop(0, "#c9a56b");
  brass.addColorStop(0.5, "#9c7a45");
  brass.addColorStop(1, "#6e5430");
  ctx.fillStyle = brass;
  ctx.fillRect(0, 0, width, height);
  ctx.font = `500 ${Math.round(height * 0.42)}px "IBM Plex Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Engraving : a light edge under a dark groove.
  ctx.fillStyle = "rgba(255, 236, 200, 0.45)";
  ctx.fillText(text.toUpperCase(), width / 2 + 1, height / 2 + 2);
  ctx.fillStyle = "#2a1f12";
  ctx.fillText(text.toUpperCase(), width / 2, height / 2);
  ctx.strokeStyle = "#5a4426";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);
}
