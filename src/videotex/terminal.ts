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
    if (page.prompt === false) return frame;
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
  sendKey = (key: string): void => {
    if (key === "Envoi") key = "Enter";
    const own = this.page(this.snapshot.page).keys;
    const mapped = own?.[key] ?? (key === "Enter" && !this.snapshot.input ? own?.Envoi : undefined);
    if (mapped) {
      this.go(mapped);
      return;
    }
    // A service code typed then sent wins over the page's own Envoi.
    const code = key === "Enter" ? this.code(this.snapshot.input) : undefined;
    if (code) {
      this.go(code);
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
    if (
      [
        "Home",
        "Escape",
        "Sommaire",
        "ConnexionFin",
        "Retour",
        "Guide",
      ].includes(key)
    ) {
      this.go(this.home);
      return;
    }
    // While a code is being typed ("GOTO10"), digits go to the command line too.
    const typing = this.snapshot.input.length > 0 && key.length === 1;
    const action = typing
      ? undefined
      : this.snapshot.frame.actions.find((action) => action.key.toLowerCase() === key.toLowerCase());
    if (action) {
      this.go(action.target);
      return;
    }
    if (key === "Enter") {
      const target = this.snapshot.frame.actions.find((action) => action.key === this.snapshot.input)?.target;
      if (target) this.go(target);
      return;
    }
    let input = this.snapshot.input;
    if (key === "Backspace" || key === "Correction") input = input.slice(0, -1);
    else if (key === "Annulation") input = "";
    else if (key.length === 1 && input.length < 28) input += key.toUpperCase();
    else return;
    this.snapshot = {
      ...this.snapshot,
      input,
      frame: this.frame(this.snapshot.page, input),
    };
    this.notify();
  };
}
