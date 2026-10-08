import { describe, expect, it } from "vitest";
import { FOCUS_FILL, focusDistance, focusPosition, framings } from "../src/scene/framing";

describe("cadrages : zoom et mise au point", () => {
  it("limite de zoom rapprochée (8 octobre 2026)", () => {
    expect(framings.desk.minDistance).toBe(3);
    expect(framings.floor.minDistance).toBe(2.6);
    for (const framing of Object.values(framings)) expect(framing.minDistance).toBeLessThan(framing.maxDistance);
  });

  it("l'écran occupe FOCUS_FILL de la vue, selon la contrainte la plus serrée", () => {
    const screen = { normal: [0, 0, 1] as [number, number, number], width: 1.2, height: 0.9 };
    const tan = Math.tan((40 * Math.PI) / 360);
    // Wide view : the height limits.
    const wide = focusDistance(screen, 40, 16 / 9);
    expect(screen.height / (2 * wide * tan)).toBeCloseTo(FOCUS_FILL, 6);
    // Portrait view : the width limits, the camera stands further back.
    const tall = focusDistance(screen, 40, 9 / 16);
    expect(screen.width / (2 * tall * tan * (9 / 16))).toBeCloseTo(FOCUS_FILL, 6);
    expect(tall).toBeGreaterThan(wide);
  });

  it("la caméra se place face au verre, sur sa normale", () => {
    const screen = { normal: [0, 0.6, 0.8] as [number, number, number], width: 1, height: 1 };
    const [x, y, z] = focusPosition([1, 2, 3], screen, 40, 1);
    const d = focusDistance(screen, 40, 1);
    expect([x, y, z].map((v) => +v.toFixed(6))).toEqual([1, +(2 + 0.6 * d).toFixed(6), +(3 + 0.8 * d).toFixed(6)]);
  });
});
