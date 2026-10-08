import { afterEach, describe, expect, it, vi } from "vitest";
import { g1ToMosaic } from "../src/videotex/mosaic";
import { EYE_ROWS, LemegetonEyes, lemegetonRows, mosaicToG1 } from "../src/eyes/lemegetonEyes";
import { EyesController } from "../src/eyes/EyesController";

// Mirror of a sextant mask around the vertical axis of its cell.
const mirror = (m: number) =>
  ((m & 1) << 1) | ((m & 2) >> 1) | ((m & 4) << 1) | ((m & 8) >> 1) | ((m & 16) << 1) | ((m & 32) >> 1);
const lit = (cells: number[][]) => cells.flat().filter((m) => m !== 0).length;

describe("yeux Lemegeton (firmware Minitel_Clavicula)", () => {
  it("conversion mosaïque ↔ G1 sur les 64 motifs", () => {
    for (let m = 0; m < 64; m++) {
      const byte = mosaicToG1(m);
      expect(byte & 0x20).toBe(0x20);
      expect(g1ToMosaic(byte)).toBe(m);
    }
  });

  it("au repos : deux ovales symétriques, rangées 2 à 20", () => {
    const eyes = new LemegetonEyes(() => 0.5, 0);
    const { eyes: cells, ring } = eyes.cells(false);
    expect(cells).toHaveLength(EYE_ROWS);
    expect(lit(cells)).toBeGreaterThan(40);
    expect(lit(ring)).toBe(0);
    for (const line of cells) for (let c = 0; c < 40; c++) expect(line[39 - c]).toBe(mirror(line[c]));
    const rows = lemegetonRows({ eyes: cells, ring }, "BLANC");
    expect(Math.min(...rows.map((r) => r[0]))).toBeGreaterThanOrEqual(2);
    expect(Math.max(...rows.map((r) => r[0]))).toBeLessThanOrEqual(20);
  });

  it("émotion : jouée, tenue, puis retour au neutre", () => {
    const eyes = new LemegetonEyes(() => 0.5, 0);
    const rest = lit(eyes.cells(false).eyes);
    eyes.play("joy", 0);
    // Joy squeezes the eyes into thin tilted bars.
    eyes.update(500, false, false);
    expect(lit(eyes.cells(false).eyes)).toBeLessThan(rest);
    expect(eyes.currentEmotion).toBe("joy");
    // Timeline 800 ms x 2.5, then a 1.2 s hold, then a 400 ms x 2.5 return.
    for (let t = 500; t <= 6000; t += 90) eyes.update(t, false, false);
    expect(eyes.currentEmotion).toBeNull();
    expect(eyes.busy).toBe(false);
    expect(lit(eyes.cells(false).eyes)).toBe(rest);
  });

  it("visage : un contour de tête, les yeux plus petits", () => {
    const eyes = new LemegetonEyes(() => 0.5, 0);
    const face = eyes.cells(true);
    expect(lit(face.ring)).toBeGreaterThan(60);
    expect(lit(face.eyes)).toBeLessThan(lit(eyes.cells(false).eyes));
  });
});

describe("contrôleur : style Lemegeton", () => {
  afterEach(() => vi.useRealTimers());
  it("touches du firmware : chiffres = émotions, Retour = neutre", () => {
    vi.useFakeTimers();
    let now = 0;
    const controller = new EyesController({ style: "lemegeton", palette: "auto", random: () => 0.5, now: () => now });
    expect(controller.getSnapshot().moodLabel).toBe("NEUTRE");
    controller.key("3");
    expect(controller.getSnapshot().moodLabel).toBe("COLERE");
    // Auto palette : anger is red.
    const red = controller.getSnapshot().frame.cells.filter((cell) => cell.mosaic && cell.fg === 1).length;
    expect(red).toBeGreaterThan(0);
    controller.key("Retour");
    now = 2000;
    vi.advanceTimersByTime(2000);
    expect(controller.getSnapshot().moodLabel).toBe("NEUTRE");
    controller.stop();
  });
});
