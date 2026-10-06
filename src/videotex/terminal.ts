import { type TerminalFrame, text } from "./screen";
export interface TerminalPage {
  id: string;
  render: () => TerminalFrame;
}
export interface TerminalSnapshot {
  page: string;
  frame: TerminalFrame;
  input: string;
}
export class Terminal {
  private listeners = new Set<() => void>();
  private snapshot: TerminalSnapshot;
  constructor(
    private pages: TerminalPage[],
    private home: string,
  ) {
    if (!pages.some((page) => page.id === home))
      throw new Error(`Page absente: ${home}`);
    this.snapshot = { page: home, frame: this.frame(home, ""), input: "" };
  }
  private frame(id: string, input: string): TerminalFrame {
    const page = this.pages.find((page) => page.id === id);
    if (!page) throw new Error(`Page absente: ${id}`);
    const frame = page.render();
    text(frame, 3, 22, `> ${input}`, 2);
    frame.cursor = { x: 5 + input.length, y: 22 };
    return frame;
  }
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = (): TerminalSnapshot => this.snapshot;
  go = (id: string): void => {
    this.snapshot = { page: id, frame: this.frame(id, ""), input: "" };
    this.listeners.forEach((listener) => listener());
  };
  sendKey = (key: string): void => {
    if (key === "Envoi") key = "Enter";
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
    const action = this.snapshot.frame.actions.find(
      (action) => action.key.toLowerCase() === key.toLowerCase(),
    );
    if (action) {
      this.go(action.target);
      return;
    }
    if (key === "Enter" || key === "Envoi") {
      const selected = this.snapshot.frame.actions.find(
        (action) => action.key === this.snapshot.input,
      );
      if (selected) this.go(selected.target);
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
    this.listeners.forEach((listener) => listener());
  };
}
