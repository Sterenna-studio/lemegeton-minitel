import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

// Procedural black marble in the spirit of the Telic Alcatel Terminatel 255
// (black base, sand-gold and grey veins). Drawn from a seeded generator : no
// photograph is used, and the same seed always gives the same slab.

function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Vein {
  points: [number, number][];
  width: number;
  color: string;
  halo: string;
}

function vein(
  rand: () => number,
  size: number,
  start: [number, number],
  angle: number,
  length: number,
  width: number,
  gold: boolean,
): Vein[] {
  const points: [number, number][] = [start];
  const veins: Vein[] = [];
  let [x, y] = start;
  let heading = angle;
  const step = size / 160;
  for (let i = 0; i < length; i++) {
    // Low curvature noise : long, lazy veins rather than cracks.
    heading += (rand() - 0.5) * 0.22 + Math.sin(i * 0.07) * 0.02;
    x += Math.cos(heading) * step * (0.6 + rand());
    y += Math.sin(heading) * step * (0.6 + rand());
    points.push([x, y]);
    // Thin branches, as in real portoro-type marble.
    if (width > 1.2 && rand() < 0.008)
      veins.push(
        ...vein(rand, size, [x, y], heading + (rand() - 0.5) * 2.2,
          Math.floor(length * 0.35), width * 0.45, gold && rand() < 0.6),
      );
  }
  veins.unshift({
    points,
    width,
    color: gold ? "rgba(201, 165, 107, 0.62)" : "rgba(168, 166, 158, 0.3)",
    halo: gold ? "rgba(176, 136, 82, 0.12)" : "rgba(140, 140, 134, 0.07)",
  });
  return veins;
}

/** Tileable black marble slab drawn on a canvas. */
export function createMarbleCanvas(size = 1024, seed = 255): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const rand = random(seed);
  ctx.fillStyle = "#0d0c0b";
  ctx.fillRect(0, 0, size, size);
  // Soft clouds give depth to the black base.
  for (let i = 0; i < 46; i++) {
    const x = rand() * size, y = rand() * size, r = size * (0.08 + rand() * 0.22);
    const cloud = ctx.createRadialGradient(x, y, 0, x, y, r);
    cloud.addColorStop(0, rand() < 0.5 ? "rgba(38, 34, 30, 0.35)" : "rgba(4, 4, 4, 0.4)");
    cloud.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = cloud;
    for (const dx of [-size, 0, size])
      for (const dy of [-size, 0, size]) {
        ctx.save();
        ctx.translate(dx, dy);
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
        ctx.restore();
      }
  }
  const veins: Vein[] = [];
  // A dominant direction, as in a cut slab, with a few crossing veins.
  const grain = rand() * Math.PI;
  for (let i = 0; i < 7; i++)
    veins.push(
      ...vein(rand, size, [rand() * size, rand() * size],
        grain + (i % 3 === 0 ? Math.PI / 2 : 0) + (rand() - 0.5) * 0.6,
        90 + Math.floor(rand() * 90), 0.8 + rand() * 1.8, i % 3 !== 2),
    );
  ctx.lineCap = ctx.lineJoin = "round";
  for (const { points, width, color, halo } of veins)
    for (const dx of [-size, 0, size])
      for (const dy of [-size, 0, size]) {
        ctx.beginPath();
        points.forEach(([px, py], index) =>
          index ? ctx.lineTo(px + dx, py + dy) : ctx.moveTo(px + dx, py + dy),
        );
        ctx.strokeStyle = halo;
        ctx.lineWidth = width * 4;
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
      }
  return canvas;
}

let texture: CanvasTexture | undefined;
/** Shared marble texture for 3D finishes, created once. */
export function marbleTexture(): CanvasTexture {
  if (!texture) {
    texture = new CanvasTexture(createMarbleCanvas());
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.anisotropy = 4;
  }
  return texture;
}

/** Same slab as a data URL, for the page background. */
export function marbleDataUrl(size = 768): string {
  return createMarbleCanvas(size).toDataURL("image/jpeg", 0.86);
}
