import { describe, expect, it } from "vitest";
import { createLemegetonTerminal } from "../src/demo/LemegetonTerminal";
import type { Goto10Index, Loader } from "../src/goto10/service";
import { decodeVideotex, decodeVideotexScreen, videotexPages } from "../src/videotex/decoder";
import { COLS, plainText } from "../src/videotex/screen";

// 3615 GOTO10 (src/goto10/service.ts) on a tiny in-memory selection, and the
// Videotex decoder (src/videotex/decoder.ts) on hand-made streams.

const bytes = (...parts: (number | string)[]) =>
  new Uint8Array(parts.flatMap((part) => (typeof part === "string" ? Array.from(part, (c) => c.charCodeAt(0)) : [part])));

const FF = 0x0c,
  US = 0x1f,
  ESC = 0x1b,
  SO = 0x0e,
  REP = 0x12,
  SS2 = 0x19;

const index: Goto10Index = {
  source: "https://www.goto10.fr/",
  author: "Frederic Cambus",
  retrieved: "2026-10-13",
  screens: [{ id: "deux-pages", title: "Deux pages", credit: "", source: "minitel/x.vdt", bytes: 0 }],
  sections: [{ id: "presse", title: "Articles", docs: [{ id: "article", title: "Un article", pages: 2 }] }],
};
const files: Record<string, Uint8Array> = {
  "index.json": new TextEncoder().encode(JSON.stringify(index)),
  "ecrans/deux-pages.vdt": bytes(FF, US, 0x41, 0x41, "PAGE UN", FF, US, 0x41, 0x41, "PAGE DEUX"),
  "docs/article.json": new TextEncoder().encode(
    JSON.stringify({ id: "article", title: "Un article", source: "minitel/a.txt", lines: Array.from({ length: 25 }, (_, i) => `ligne ${i + 1}`) }),
  ),
};
const loader: Loader = async (path) => {
  const file = files[path];
  if (!file) throw new Error(path);
  return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
};
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const screen = (terminal: ReturnType<typeof createLemegetonTerminal>) => plainText(terminal.getSnapshot().frame);

describe("decodeur Videotex", () => {
  it("positionne, colore, accentue et repete", () => {
    const cells = decodeVideotex(bytes(FF, US, 0x42, 0x43, ESC, 0x41, "Bonjour ", SS2, 0x42, "e", "t", SS2, 0x41, "a", "!", REP, 0x42));
    const row = cells.slice(2 * COLS, 3 * COLS);
    expect(row.map((cell) => cell.char).join("").trim()).toBe("Bonjour étà!!!");
    expect(row[2].fg).toBe(1);
  });

  it("dessine les mosaiques G1, y compris les codes 0x40 a 0x5F", () => {
    const cells = decodeVideotex(bytes(FF, US, 0x41, 0x41, SO, 0x7f, 0x5f, 0x20));
    expect(cells[COLS].mosaic).toBe(63);
    expect(cells[COLS + 1].mosaic).toBe(cells[COLS].mosaic! & 0x3f);
    expect(cells[COLS + 2].mosaic).toBe(0);
  });

  it("double hauteur : le glyphe monte d'une rangee", () => {
    const cells = decodeVideotex(bytes(FF, US, 0x45, 0x41, ESC, 0x4d, "A"));
    // Cursor on row 5 : the glyph takes rows 4 and 5.
    expect(cells[4 * COLS]).toMatchObject({ char: "A", h: 2 });
    expect(cells[5 * COLS].covered).toBe(true);
  });

  it("Videotex photographique : photo placee, octets JPEG jamais lus comme des codes", () => {
    const describe = [ESC, 0x70, 0x23, 0x40, 0x7f, 0x21, 0x32, 0x42, 0x02, 0x01, 0x4d, 0x42, 0x01, 0x00, 0x21, 0x33, 0x42, 0x02, 0x08, 0x69, 0x42, 0x02, 0x06, 0x02];
    const jpeg = [0xff, 0xd8, 0xff, 0xe0, FF, 0x1b, 0x12, 0xff, 0xd9];
    const stream = bytes(FF, US, 0x4a, 0x42, "1", ...describe, ESC, 0x70, 0x23, 0x40, 0x7f, 0x67, ...jpeg, US, 0x58, 0x41, "FIN");
    expect(videotexPages(stream)).toEqual([0]);
    const { photos, cells } = decodeVideotexScreen(stream);
    // Column from the header (1.6 units x 1.25 = 2 -> column 3), row from the cursor.
    expect(photos).toHaveLength(1);
    expect(photos[0]).toMatchObject({ x: 3, y: 10 });
    expect(photos[0].w).toBeCloseTo(11, 1);
    expect(photos[0].h).toBeCloseTo(6, 1);
    expect(Array.from(photos[0].jpeg)).toEqual(jpeg);
    expect(cells.slice(24 * COLS, 24 * COLS + 3).map((cell) => cell.char).join("")).toBe("FIN");
  });

  it("coupe un flux en ecrans a chaque FF", () => {
    const stream = files["ecrans/deux-pages.vdt"];
    const pages = videotexPages(stream);
    expect(pages).toHaveLength(2);
    expect(plainText({ title: "", status: "", actions: [], cells: decodeVideotex(stream, pages[1]) })).toBe("PAGE DEUX");
  });
});

describe("3615 GOTO10", () => {
  it("s'ouvre par la touche 4 du sommaire ou par son code", async () => {
    const terminal = createLemegetonTerminal(loader);
    const choose = (...keys: string[]) => keys.forEach((key) => terminal.sendKey(key));
    choose("4", "Envoi");
    expect(terminal.getSnapshot().page).toBe("goto10");
    expect(terminal.getSnapshot().frame.service).toBe("3615 GOTO10");
    choose("0", "Envoi");
    expect(terminal.getSnapshot().page).toBe("home");
    // From a page with its own Envoi, the typed code still wins.
    choose("1", "Envoi");
    expect(terminal.getSnapshot().page).toBe("connection");
    for (const key of "GOTO10") terminal.sendKey(key);
    terminal.sendKey("Envoi");
    expect(terminal.getSnapshot().page).toBe("goto10");
  });

  it("feuillette les ecrans d'epoque avec SUITE et RETOUR", async () => {
    const terminal = createLemegetonTerminal(loader);
    terminal.go("goto10");
    terminal.sendKey("1");
    terminal.sendKey("Envoi");
    expect(screen(terminal)).toContain("CONNEXION A GOTO10");
    await settle();
    expect(screen(terminal)).toContain("Deux pages");
    terminal.sendKey("1");
    terminal.sendKey("Envoi");
    await settle();
    expect(screen(terminal)).toBe("PAGE UN");
    terminal.sendKey("Suite");
    expect(screen(terminal)).toBe("PAGE DEUX");
    expect(terminal.getSnapshot().frame.title).toBe("Deux pages · 2/2");
    // On a full-screen page, what is typed shows on the status row.
    terminal.sendKey("7");
    expect(screen(terminal).split("\n")[0]).toBe("> 7");
    terminal.sendKey("Annulation");
    terminal.sendKey("Retour");
    expect(screen(terminal)).toBe("PAGE UN");
    terminal.sendKey("Retour");
    expect(terminal.getSnapshot().page).toBe("goto10/ecrans/0");
  });

  it("lit un document page par page", async () => {
    const terminal = createLemegetonTerminal(loader);
    terminal.go("goto10/docs");
    await settle();
    for (const key of ["1", "Envoi", "1", "Envoi"]) terminal.sendKey(key);
    await settle();
    expect(screen(terminal)).toContain("ligne 19");
    expect(screen(terminal)).not.toContain("ligne 20");
    terminal.sendKey("Suite");
    expect(screen(terminal)).toContain("ligne 25");
    expect(screen(terminal)).toContain("2/2");
    terminal.sendKey("Sommaire");
    expect(terminal.getSnapshot().page).toBe("goto10/docs/presse/0");
    terminal.sendKey("Sommaire");
    expect(terminal.getSnapshot().page).toBe("goto10");
  });

  it("annonce un service indisponible si la selection manque", async () => {
    const terminal = createLemegetonTerminal(async () => {
      throw new Error("hors ligne");
    });
    terminal.go("goto10/ecrans/0");
    await settle();
    expect(screen(terminal)).toContain("INDISPONIBLE");
  });
});

describe("ligne de commande de la console", () => {
  it("3615 GOTO10 envoye d'un bloc ouvre le service, meme depuis le sommaire", () => {
    const terminal = createLemegetonTerminal(loader);
    terminal.submit("3615 goto10");
    expect(terminal.getSnapshot().page).toBe("goto10");
    terminal.submit("0");
    expect(terminal.getSnapshot().page).toBe("home");
    terminal.submit("inconnu");
    expect(terminal.getSnapshot().input).toBe("INCONNU");
  });
});
