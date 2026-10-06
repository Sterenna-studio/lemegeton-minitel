import { afterEach, describe, expect, it, vi } from "vitest";
import { g1ToMosaic, paintRows } from "../src/videotex/mosaic";
import { COLS, createScreen, plainText } from "../src/videotex/screen";
import { buildEyes, initialEyeState } from "../src/eyes/libEyes";
import { EyesController } from "../src/eyes/EyesController";
import { buildZyraEyes } from "../src/eyes/libZyraEyes";

const cell = (frame: ReturnType<typeof createScreen>, row: number, col: number) =>
  frame.cells[row * COLS + (col - 1)];

describe("mosaique Videotex G1", () => {
  it("convertit les octets G1 en sextants 2 x 3", () => {
    expect(g1ToMosaic(0x20)).toBe(0); // vide
    expect(g1ToMosaic(0x7f)).toBe(63); // plein
    expect(g1ToMosaic(0x21)).toBe(1); // haut gauche
    expect(g1ToMosaic(0x60)).toBe(32); // bas droite (bit 0x40)
    expect(g1ToMosaic(0x70)).toBe(48); // rangee du bas
  });
  it("peint des rangees minitel-face sur la grille", () => {
    const frame = createScreen("TEST");
    paintRows(frame, [[11, 7, "CYAN", [0x7f, 0x20]]]);
    expect(cell(frame, 11, 7)).toMatchObject({ mosaic: 63, fg: 6 });
    expect(cell(frame, 11, 8).mosaic).toBeUndefined();
  });
});

describe("yeux LibEyes", () => {
  it("dessine deux yeux ouverts avec pupille au centre", () => {
    const rows = buildEyes(initialEyeState, "BLANC");
    expect(rows).toHaveLength(6);
    const left = rows.find(([row, col]) => row === 11 && col === 7)!;
    expect(left[3][3]).toBe(0x20); // pupille colonne 10
    const right = rows.find(([row, col]) => row === 11 && col === 24)!;
    expect(right[3][3]).toBe(0x20);
  });
  it("suit le regard et les humeurs", () => {
    const looking = buildEyes({ ...initialEyeState, gazeX: 1 });
    expect(looking.find(([row, col]) => row === 11 && col === 7)![3][4]).toBe(0x20);
    expect(buildEyes({ ...initialEyeState, eyeOpen: false })).toHaveLength(2);
    expect(buildEyes({ ...initialEyeState, mood: "happy" }).every(([row]) => row === 13)).toBe(true);
    expect(buildEyes({ ...initialEyeState, mood: "surprised" }).some(([row]) => row === 8)).toBe(true);
  });
});

describe("yeux Zyra", () => {
  it("dessine des capsules continues avec pupille", () => {
    const rows = buildZyraEyes(initialEyeState, "CYAN");
    expect(rows).toHaveLength(6);
    expect(rows[0]).toEqual([9, 10, "CYAN", [0x70, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x2f]]);
    expect(rows[1][3][3]).toBe(0x20);
  });
  it("prend les couleurs d'humeur en mode auto", () => {
    expect(buildZyraEyes({ ...initialEyeState, mood: "angry" }, "AUTO")[0][2]).toBe("ROUGE");
    expect(buildZyraEyes({ ...initialEyeState, mood: "love" }, "AUTO")[0][2]).toBe("MAGENTA");
    expect(buildZyraEyes({ ...initialEyeState, mood: "love" }, "VERT")[0][2]).toBe("VERT");
  });
  it("garde le style classique LibEyes au choix", () => {
    const eyes = new EyesController({ style: "classique", palette: "blanc" });
    expect(cell(eyes.getSnapshot().frame, 13, 7)).toMatchObject({ mosaic: 63, fg: 7 });
    eyes.setStyle("zyra");
    expect(cell(eyes.getSnapshot().frame, 13, 7).mosaic).toBeUndefined();
  });
});

describe("moteur des yeux", () => {
  afterEach(() => vi.useRealTimers());

  it("reagit aux touches Minitel et affiche l'humeur", () => {
    const eyes = new EyesController({ palette: "ambre" });
    expect(plainText(eyes.getSnapshot().frame)).toContain("HUMEUR : NEUTRE");
    expect(eyes.key("Envoi")).toBe(true);
    expect(eyes.getSnapshot().state.mood).toBe("happy");
    expect(plainText(eyes.getSnapshot().frame)).toContain("HUMEUR : JOIE");
    expect(cell(eyes.getSnapshot().frame, 11, 10).fg).toBe(3); // ambre = JAUNE
    expect(eyes.key("x")).toBe(false);
  });

  it("joue les sequences dans le temps", async () => {
    vi.useFakeTimers();
    const eyes = new EyesController();
    eyes.key("Sommaire"); // fall_asleep
    expect(eyes.getSnapshot().state.eyeState).toBe("half");
    await vi.advanceTimersByTimeAsync(1000);
    expect(eyes.getSnapshot().state.eyeState).toBe("closed");
    eyes.key("Retour"); // reveil
    await vi.advanceTimersByTimeAsync(1000);
    expect(eyes.getSnapshot().state).toMatchObject({ eyeState: null, moodOverride: null });
  });

  it("vit seul en mode autonome et s'arrete proprement", async () => {
    vi.useFakeTimers();
    const eyes = new EyesController({ random: () => 0 });
    const seen = new Set<string | null>();
    eyes.subscribe(() => seen.add(eyes.getSnapshot().state.eyeState));
    eyes.start();
    await vi.advanceTimersByTimeAsync(1200); // premier clignement a 1 s
    expect(seen.has("closed")).toBe(true);
    eyes.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});
