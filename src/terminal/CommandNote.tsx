import { useState } from "react";
import { StickyNote, X } from "lucide-react";
import { t, useLang, type MessageKey } from "../i18n";

// The usual commands of the terminal on a sticky note, next to the screen :
// each Minitel key with its key on the computer's keyboard. The note's
// buttons send the key too. Folded or not, the choice is kept in the browser.

const STORAGE = "minitel-musee:aide-memoire";

/** Minitel key, its key on the keyboard, what it does. */
const COMMANDS: [string, MessageKey, MessageKey][] = [
  ["Envoi", "note.key.enter", "note.send"],
  ["Suite", "note.key.pageDown", "note.next"],
  ["Retour", "note.key.pageUp", "note.previous"],
  ["Sommaire", "note.key.escape", "note.index"],
  ["Correction", "note.key.backspace", "note.correction"],
  ["Annulation", "note.key.delete", "note.cancel"],
  ["Guide", "note.key.f1", "note.guide"],
];

function initiallyOpen(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE);
    if (saved) return saved === "ouvert";
  } catch {
    // Storage blocked : the default below.
  }
  // Folded on a phone, where the screen is small.
  return !window.matchMedia?.("(max-width: 600px)").matches;
}

export function CommandNote({ sendKey }: { sendKey: (key: string) => void }) {
  useLang();
  const [open, setOpen] = useState(initiallyOpen);
  const toggle = (next: boolean) => {
    setOpen(next);
    try {
      localStorage.setItem(STORAGE, next ? "ouvert" : "ferme");
    } catch {
      // Not kept : it opens again next time.
    }
  };
  if (!open)
    return (
      <button type="button" className="note-tab" aria-expanded={false} onClick={() => toggle(true)}>
        <StickyNote size={16} /> {t("note.title")}
      </button>
    );
  return (
    <aside className="command-note" aria-label={t("note.title")}>
      <header>
        <strong>{t("note.title")}</strong>
        <button type="button" aria-label={t("note.close")} title={t("note.close")} aria-expanded={true} onClick={() => toggle(false)}>
          <X size={14} />
        </button>
      </header>
      <p>{t("note.intro")}</p>
      <ul>
        {COMMANDS.map(([key, hint, label]) => (
          <li key={key}>
            <button type="button" translate="no" onClick={() => sendKey(key)}>
              {key.toUpperCase()}
            </button>
            <kbd>{t(hint)}</kbd>
            <span>{t(label)}</span>
          </li>
        ))}
      </ul>
      <p className="note-code">
        <strong translate="no">3615 GOTO10</strong> {t("note.goto10")}
      </p>
    </aside>
  );
}
