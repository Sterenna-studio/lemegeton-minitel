import { type TerminalFrame, text } from "./screen";
export interface TerminalPage {
  id: string;
  render: () => TerminalFrame;
  /** Command line on row 22 (default). Off for pages that use the whole screen. */
  prompt?: boolean;
  /** Keys of this page (Suite, Retour, Sommaire...) -> target page, before the defaults. */
  keys?: Record<string, string>;
}
export interface TerminalSnapshot {
  page: string;
  frame: TerminalFrame;
  input: string;
}
export interface TerminalOptions {
  /** Pages built on demand, for ids that are not in the list (e.g. "goto10/ecran/pinky/3"). */
  resolve?: (id: string) => TerminalPage | undefined;
  /** Service codes typed then sent, like on a Minitel ("GOTO10" -> "goto10"). */
  codes?: Record<string, string>;
}
export class Terminal {
  private listeners = new Set<() => void>();
  private snapshot: TerminalSnapshot;
  constructor(
    private pages: TerminalPage[],
    private home: string,
    private options: TerminalOptions = {},
  ) {
    if (!pages.some((page) => page.id === home))
      throw new Error(`Page absente: ${home}`);
    this.snapshot = { page: home, frame: this.frame(home, ""), input: "" };
  }
  private page(id: string): TerminalPage {
    const page = this.pages.find((page) => page.id === id) ?? this.options.resolve?.(id);
    if (!page) throw new Error(`Page absente: ${id}`);
    return page;
  }
  private frame(id: string, input: string): TerminalFrame {
    const page = this.page(id);
    const frame = page.render();
    if (page.prompt === false) {
      // A page that uses the whole screen : what is typed shows on the status row.
      if (input) {
        for (let x = 0; x < 40; x++) frame.cells[x] = { char: " ", fg: 2, bg: 0 };
        text(frame, 1, 0, `> ${input}`, 2);
        frame.cursor = { x: 3 + input.length, y: 0 };
      }
      return frame;
    }
    text(frame, 3, 22, `> ${input}`, 2);
    frame.cursor = { x: 5 + input.length, y: 22 };
    return frame;
  }
  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = (): TerminalSnapshot => this.snapshot;
  go = (id: string): void => {
    this.snapshot = { page: id, frame: this.frame(id, ""), input: "" };
    this.notify();
  };
  /** Draws the current page again (its data has arrived), keeping the command line. */
  refresh = (): void => {
    this.snapshot = { ...this.snapshot, frame: this.frame(this.snapshot.page, this.snapshot.input) };
    this.notify();
  };
  /** A whole command typed then sent (the console's field) : a code, a choice, or left typed. */
  submit = (value: string): void => {
    const input = value.trim().toUpperCase().slice(0, 28);
    if (!input) return this.sendKey("Enter");
    const target =
      this.code(input) ??
      this.snapshot.frame.actions.find((action) => action.key.toLowerCase() === input.toLowerCase())?.target;
    if (target) return this.go(target);
    this.snapshot = { ...this.snapshot, input, frame: this.frame(this.snapshot.page, input) };
    this.notify();
  };
  private code(input: string): string | undefined {
    const typed = input.replace(/\s+/g, "").replace(/^3615/, "");
    return this.options.codes?.[typed];
  }
  /**
   * A key of the Minitel. Letters and digits are typed on the command line and
   * wait for ENVOI, as on the Minitel ; the function keys act at once
   * (SUITE, RETOUR, SOMMAIRE, GUIDE, REPETITION, CORRECTION, ANNULATION).
   */
  sendKey = (key: string): void => {
    if (key === "Envoi") key = "Enter";
    if (key === "Backspace") key = "Correction";
    if (key === "Delete") key = "Annulation";
    if (key === "Home" || key === "Escape") key = "Sommaire";
    const input = this.snapshot.input;
    const own = this.page(this.snapshot.page).keys;
    if (key === "Enter") {
      // A service code, then a choice of the page, then the page's own ENVOI.
      const target =
        this.code(input) ??
        this.snapshot.frame.actions.find((action) => action.key.toLowerCase() === (input || "enter").toLowerCase())?.target ??
        (input ? undefined : own?.Envoi);
      if (target) this.go(target);
      return;
    }
    if (key === "Correction" || key === "Annulation") {
      this.type(key === "Correction" ? input.slice(0, -1) : "");
      return;
    }
    if (key.length === 1) {
      if (input.length < 28) this.type(input + key.toUpperCase());
      return;
    }
    const mapped = own?.[key];
    if (mapped) {
      this.go(mapped);
      return;
    }
    if (key === "Repetition") {
      this.go(this.snapshot.page);
      return;
    }
    if (key === "Suite") {
      const next = this.snapshot.frame.actions.find(
        (action) => action.target !== this.home,
      );
      if (next) this.go(next.target);
      return;
    }
    if (["Sommaire", "ConnexionFin", "Retour", "Guide"].includes(key)) this.go(this.home);
  };
  private type(input: string): void {
    this.snapshot = { ...this.snapshot, input, frame: this.frame(this.snapshot.page, input) };
    this.notify();
  }
}
