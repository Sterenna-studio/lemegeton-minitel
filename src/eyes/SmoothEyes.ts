// Rendu « classique » des yeux : lisse et lumineux, comme l'overlay OBS de
// Lemegeton (nitro-clicker obs-lemegeton.html, Web-Eye-Animation) : ovales
// verticaux en degrade c1 -> c2 -> c3 avec halo, paupieres par humeur,
// transitions douces et micro-mouvements. Il dessine dans son propre canvas
// 800 x 600, televerse sur l'ecran 3D comme source continue.
import { WIDTH, HEIGHT, applyCrtEffects, type CrtEffects } from "../videotex/renderer";
import type { EyesController, EyePaletteId } from "./EyesController";
import type { EyeState, Mood } from "./libEyes";

interface EyeColors {
  c1: string;
  c2: string;
  c3: string;
  glow: string;
}
// COLOR_PRESETS de l'overlay (nitro-clicker), par palette.
const PRESETS = {
  default: { c1: "#d6fff5", c2: "#00ffcc", c3: "#00b3ff", glow: "#00ccff" },
  phosphor: { c1: "#efffef", c2: "#00ff44", c3: "#007722", glow: "#00ff44" },
  amber: { c1: "#fff8e0", c2: "#ffaa00", c3: "#994400", glow: "#ff8800" },
  red: { c1: "#fff0f0", c2: "#ff3333", c3: "#cc0000", glow: "#ff2200" },
  nitro: { c1: "#e8f0ff", c2: "#7744ff", c3: "#3300cc", glow: "#6633ff" },
  ice: { c1: "#ffffff", c2: "#aaddff", c3: "#3399ff", glow: "#88ccff" },
  yellow: { c1: "#fffef0", c2: "#ffe600", c3: "#cc9900", glow: "#ffcc00" },
  pink: { c1: "#fff0f8", c2: "#ff66cc", c3: "#cc0077", glow: "#ff44aa" },
  white: { c1: "#ffffff", c2: "#eef2f0", c3: "#9aa6a2", glow: "#ffffff" },
} satisfies Record<string, EyeColors>;
const BY_PALETTE: Record<Exclude<EyePaletteId, "auto">, EyeColors> = {
  cyan: PRESETS.default,
  phosphore: PRESETS.phosphor,
  ambre: PRESETS.amber,
  rouge: PRESETS.red,
  nitro: PRESETS.nitro,
  blanc: PRESETS.white,
};
// « Auto » : couleurs d'humeur, dans l'esprit de Zyra.
const BY_MOOD: Partial<Record<Mood, EyeColors>> = {
  happy: PRESETS.yellow,
  angry: PRESETS.red,
  love: PRESETS.pink,
  tired: PRESETS.ice,
  disgust: PRESETS.ice,
};

/** Parametres continus d'un oeil, interpoles d'un etat a l'autre. */
interface Shape {
  open: number;
  tilt: number;
  smile: number;
  heart: number;
  size: number;
  squint: number;
  dx: number;
  dy: number;
}
const KEYS = ["open", "tilt", "smile", "heart", "size", "squint", "dx", "dy"] as const;

export function targetShapes(state: EyeState): [Shape, Shape] {
  const mood = state.moodOverride ?? state.mood;
  const shape: Shape = { open: 1, tilt: 0, smile: 0, heart: 0, size: 1, squint: 0, dx: state.gazeX, dy: state.gazeY };
  if (mood === "happy") shape.smile = 1;
  if (mood === "angry") Object.assign(shape, { tilt: 1, open: 0.8 });
  if (mood === "surprised") shape.size = 1.18;
  if (mood === "tired") shape.open = 0.45;
  if (mood === "fear") Object.assign(shape, { size: 0.85, dy: -0.7 });
  if (mood === "disgust") Object.assign(shape, { open: 0.55, squint: 0.45 });
  if (mood === "love") shape.heart = 1;
  if (state.eyeState === "half") shape.open = 0.45;
  const left = { ...shape };
  const right = { ...shape };
  if (!state.eyeOpen || state.eyeState === "closed") left.open = right.open = 0;
  if (state.eyeState === "wink_left") left.open = 0;
  if (state.eyeState === "wink_right") right.open = 0;
  return [left, right];
}

const BACKGROUND = "#010604";

function heartPath(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.moveTo(0, h * 0.55);
  ctx.bezierCurveTo(-w * 1.25, -h * 0.1, -w * 0.6, -h * 0.95, 0, -h * 0.35);
  ctx.bezierCurveTo(w * 0.6, -h * 0.95, w * 1.25, -h * 0.1, 0, h * 0.55);
}

export class SmoothEyes {
  readonly canvas: HTMLCanvasElement;
  private layer: HTMLCanvasElement;
  private current: [Shape, Shape];
  private target: [Shape, Shape];
  private colors: EyeColors;
  private effects: CrtEffects | null = null;
  private reducedMotion = false;
  private scale = 1;
  private frame = 0;
  private last = 0;
  private unsubscribe: (() => void) | null = null;

  constructor(private eyes: EyesController) {
    this.canvas = document.createElement("canvas");
    this.layer = document.createElement("canvas");
    for (const canvas of [this.canvas, this.layer]) {
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
    }
    this.target = targetShapes(eyes.getSnapshot().state);
    this.current = [{ ...this.target[0] }, { ...this.target[1] }];
    this.colors = this.pickColors();
  }

  private sync = () => {
    this.target = targetShapes(this.eyes.getSnapshot().state);
    this.colors = this.pickColors();
  };

  private pickColors(): EyeColors {
    const { palette, state } = this.eyes.getSnapshot();
    if (palette === "auto") return BY_MOOD[state.moodOverride ?? state.mood] ?? PRESETS.default;
    return BY_PALETTE[palette];
  }

  setOptions(options: { effects: CrtEffects; reducedMotion: boolean; scale: number }) {
    this.effects = options.effects;
    this.reducedMotion = options.reducedMotion;
    this.scale = options.scale;
    if (!this.frame) this.draw(performance.now());
  }

  /** Boucle de dessin (~30 i/s) tant que le rendu classique est affiche. */
  start() {
    if (this.frame) return;
    // Abonnement le temps de l'affichage (compatible avec le double montage de StrictMode).
    this.unsubscribe?.();
    this.unsubscribe = this.eyes.subscribe(this.sync);
    this.sync();
    const loop = (time: number) => {
      this.frame = requestAnimationFrame(loop);
      if (time - this.last < 32) return;
      this.step(Math.min(100, time - this.last));
      this.last = time;
      this.draw(time);
    };
    this.frame = requestAnimationFrame(loop);
  }
  stop() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private step(dt: number) {
    // Lissage exponentiel (~50 ms) : un clignement reste vif, une humeur glisse.
    const k = 1 - Math.exp(-dt / 50);
    this.current.forEach((shape, i) => {
      for (const key of KEYS) shape[key] += (this.target[i][key] - shape[key]) * k;
    });
  }

  private drawEye(ctx: CanvasRenderingContext2D, shape: Shape, side: -1 | 1, time: number) {
    const s = this.scale;
    const rx = 62 * s * shape.size;
    const ry = 105 * s * shape.size;
    // Micro-mouvements de l'overlay (startMicro), coupes en mouvement reduit.
    const jx = this.reducedMotion ? 0 : Math.sin(time / 620 + side) * 3 * s;
    const jy = this.reducedMotion ? 0 : Math.sin(time / 910) * 2 * s;
    ctx.save();
    ctx.translate(WIDTH / 2 + side * 150 * s + shape.dx * 55 * s + jx, 285 + shape.dy * 38 * s + jy);
    ctx.beginPath();
    if (shape.heart > 0.5) heartPath(ctx, rx * 1.15, ry * 1.05);
    else ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.save();
    ctx.clip();
    const fill = ctx.createRadialGradient(-rx * 0.25, -ry * 0.3, 0, 0, 0, ry * 1.1);
    fill.addColorStop(0, this.colors.c1);
    fill.addColorStop(0.55, this.colors.c2);
    fill.addColorStop(1, this.colors.c3);
    ctx.fillStyle = fill;
    ctx.fillRect(-rx * 1.3, -ry * 1.3, rx * 2.6, ry * 2.6);
    ctx.restore();
    // Les paupieres effacent l'oeil, hors du masque pour ne laisser aucun
    // liseré d'anticrenelage ; le halo suit ensuite la forme visible.
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";
    // Paupiere haute, inclinee vers l'interieur en colere.
    const lid = -ry * 1.05 + (1 - shape.open) * ry * 2.1;
    const inner = side === -1 ? rx * 1.3 : -rx * 1.3;
    ctx.beginPath();
    ctx.moveTo(-rx * 1.3, -ry * 1.4);
    ctx.lineTo(rx * 1.3, -ry * 1.4);
    ctx.lineTo(rx * 1.3, lid + (inner > 0 ? 1 : -0.3) * shape.tilt * ry * 0.5);
    ctx.lineTo(-rx * 1.3, lid + (inner < 0 ? 1 : -0.3) * shape.tilt * ry * 0.5);
    ctx.closePath();
    ctx.fill();
    // Paupiere basse (degout) et arc de joie (oeil en ∩).
    if (shape.squint > 0.01) ctx.fillRect(-rx * 1.3, ry - shape.squint * ry * 0.8, rx * 2.6, ry);
    if (shape.smile > 0.01) {
      ctx.beginPath();
      ctx.ellipse(0, ry * 1.05, rx * 1.35, ry * (0.15 + 0.95 * shape.smile), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    // Oeil ferme : un trait lumineux, comme dans l'overlay.
    if (shape.open < 0.15) {
      ctx.globalAlpha = (0.15 - shape.open) / 0.15;
      ctx.fillStyle = this.colors.c2;
      ctx.beginPath();
      ctx.roundRect(-rx * 0.9, ry * 0.92 - 6 * s, rx * 1.8, 11 * s, 6 * s);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  draw(time: number) {
    const ctx = this.canvas.getContext("2d");
    const layer = this.layer.getContext("2d");
    if (!ctx || !layer || !this.effects) return;
    layer.clearRect(0, 0, WIDTH, HEIGHT);
    this.drawEye(layer, this.current[0], -1, time);
    this.drawEye(layer, this.current[1], 1, time);
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Halo de phosphore : l'ombre suit la forme visible des yeux.
    if (this.effects.glow) {
      ctx.shadowColor = this.colors.glow;
      ctx.shadowBlur = 36 * this.scale;
    }
    ctx.drawImage(this.layer, 0, 0);
    ctx.shadowBlur = 0;
    applyCrtEffects(ctx, this.effects, time, this.reducedMotion);
  }
}
