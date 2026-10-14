import { describe, it, expect } from "vitest";
import { createLemegetonTerminal } from "../src/demo/LemegetonTerminal";
import {
  COLS,
  ROWS,
  createScreen,
  text,
  plainText,
} from "../src/videotex/screen";
describe("terminal reutilisable", () => {
  it("navigue et revient au sommaire", () => {
    const terminal = createLemegetonTerminal();
    // The choice shows on the command line and waits for ENVOI.
    terminal.sendKey("1");
    expect(terminal.getSnapshot().page).toBe("home");
    expect(plainText(terminal.getSnapshot().frame)).toContain("> 1");
    terminal.sendKey("Envoi");
    expect(terminal.getSnapshot().page).toBe("connection");
    terminal.sendKey("Envoi");
    expect(terminal.getSnapshot().page).toBe("identity");
    expect(plainText(terminal.getSnapshot().frame)).toContain("ACCES AUTORISE");
    terminal.sendKey("Sommaire");
    expect(terminal.getSnapshot().page).toBe("home");
  });
  it("affiche les archives et les messages", () => {
    const terminal = createLemegetonTerminal();
    for (const key of ["2", "Envoi"]) terminal.sendKey(key);
    expect(terminal.getSnapshot().page).toBe("archives");
    for (const key of ["0", "Envoi", "3", "Envoi"]) terminal.sendKey(key);
    expect(terminal.getSnapshot().page).toBe("messages");
    // A wrong choice stays typed, to be corrected.
    for (const key of ["9", "Envoi"]) terminal.sendKey(key);
    expect(terminal.getSnapshot()).toMatchObject({ page: "messages", input: "9" });
    terminal.sendKey("Correction");
    expect(terminal.getSnapshot().input).toBe("");
  });
  it("edite une commande bornee et notifie les abonnes", () => {
    const terminal = createLemegetonTerminal();
    let updates = 0;
    const unsubscribe = terminal.subscribe(() => updates++);
    for (let i = 0; i < 50; i++) terminal.sendKey("a");
    expect(terminal.getSnapshot().input).toHaveLength(28);
    terminal.sendKey("Correction");
    expect(terminal.getSnapshot().input).toHaveLength(27);
    terminal.sendKey("Annulation");
    expect(terminal.getSnapshot().input).toBe("");
    expect(updates).toBeGreaterThan(0);
    unsubscribe();
    const before = updates;
    terminal.sendKey("a");
    expect(updates).toBe(before);
  });
  it("conserve des snapshots stables entre modifications", () => {
    const terminal = createLemegetonTerminal();
    expect(terminal.getSnapshot()).toBe(terminal.getSnapshot());
    const before = terminal.getSnapshot();
    terminal.sendKey("2");
    expect(terminal.getSnapshot()).not.toBe(before);
  });
  it("refuse une destination inconnue", () => {
    expect(() => createLemegetonTerminal().go("absente")).toThrow(
      "Page absente",
    );
  });
});
describe("grille videotex", () => {
  it("dispose de 40 x 25 cellules et protege les limites", () => {
    const s = createScreen("test");
    expect(s.cells).toHaveLength(COLS * ROWS);
    text(s, 39, 0, "ABCDE");
    expect(s.cells[39].char).toBe("A");
    expect(s.cells[40].char).toBe(" ");
    text(s, 0, 25, "invisible");
    expect(plainText(s)).toBe("A");
  });
});
