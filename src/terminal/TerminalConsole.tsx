import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, BookOpen, Cable, Keyboard, Settings2 } from "lucide-react";
import { Tool } from "../components/Tool";
import type { TerminalFrame } from "../videotex/screen";

export interface ConsolePanels {
  reader: boolean;
  keyboard: boolean;
  settings: boolean;
}

export const closedPanels: ConsolePanels = { reader: false, keyboard: false, settings: false };

/**
 * Opening rules of the console panels : the reader and the settings close
 * the others ; the keyboard closes the settings but may stay open with the
 * reader.
 */
export function togglePanel(panels: ConsolePanels, name: keyof ConsolePanels): ConsolePanels {
  if (name === "reader") return { reader: !panels.reader, keyboard: false, settings: false };
  if (name === "keyboard") return { ...panels, keyboard: !panels.keyboard, settings: false };
  return { reader: false, keyboard: false, settings: !panels.settings };
}

/** Bottom console : service title, panel toggles, 3615 shortcuts and the command line. */
export function TerminalConsole({
  frame,
  panels,
  onToggle,
  sendKey,
  goTo,
  extraTools,
}: {
  frame: TerminalFrame;
  panels: ConsolePanels;
  onToggle: (name: keyof ConsolePanels) => void;
  sendKey: (key: string) => void;
  goTo: (page: string) => void;
  /** Extra buttons after the panel toggles (inspection in dev). */
  extraTools?: ReactNode;
}) {
  const [input, setInput] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (input) for (const key of input) sendKey(key);
    sendKey("Enter");
    setInput("");
  }
  return (
    <footer className="console">
      <div className="console-top">
        <div className="terminal-title">
          <Cable size={18} />
          <div>
            <strong>3615 LEMEGETON</strong>
            <span>{frame.title === "3615 LEMEGETON" ? "SOMMAIRE" : frame.title}</span>
          </div>
          <span className="online">EN LIGNE</span>
        </div>
        <div className="console-tools">
          <Tool label="Lecture accessible" onClick={() => onToggle("reader")} active={panels.reader}>
            <BookOpen size={18} />
          </Tool>
          <Tool label="Clavier" onClick={() => onToggle("keyboard")} active={panels.keyboard}>
            <Keyboard size={18} />
          </Tool>
          <Tool label="Reglages CRT" onClick={() => onToggle("settings")} active={panels.settings}>
            <Settings2 size={18} />
          </Tool>
          {extraTools}
        </div>
      </div>
      <div className="console-bottom">
        <nav aria-label="Navigation principale">
          <button onClick={() => goTo("home")} className="home-key">
            Sommaire
          </button>
          <button onClick={() => goTo("connection")}>
            <span>1</span>Entrer
          </button>
          <button onClick={() => goTo("archives")}>
            <span>2</span>Archives
          </button>
          <button onClick={() => goTo("messages")}>
            <span>3</span>Messages
          </button>
        </nav>
        <form onSubmit={submit}>
          <span aria-hidden="true">&gt;</span>
          <input
            aria-label="Commande du terminal"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={28}
            placeholder="Votre commande"
            autoComplete="off"
          />
          <button type="submit" aria-label="Envoi" title="Envoi">
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </footer>
  );
}

/** On-screen keys for touch devices. */
export function VirtualKeyboard({ sendKey }: { sendKey: (key: string) => void }) {
  return (
    <section className="virtual-keyboard" aria-label="Clavier du terminal">
      <div className="number-keys">
        {"1234567890".split("").map((key) => (
          <button key={key} onClick={() => sendKey(key)}>
            {key}
          </button>
        ))}
      </div>
      <div className="function-keys">
        {["Sommaire", "Correction", "Annulation", "Envoi"].map((key) => (
          <button key={key} onClick={() => sendKey(key)}>
            {key}
          </button>
        ))}
      </div>
    </section>
  );
}
