import { useEffect, useRef } from "react";
import { plainText, type TerminalFrame } from "../videotex/screen";
import { defaultEffects, renderTerminal } from "../videotex/renderer";
import { t } from "../i18n";
export function AccessibleTerminal({
  frame,
  visible,
  onKey,
}: {
  frame: TerminalFrame;
  visible: boolean;
  onKey: (key: string) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx)
      renderTerminal(
        ctx,
        frame,
        { ...defaultEffects, scanlines: false, flicker: false },
        0,
        true,
      );
  }, [frame, visible]);
  return (
    <section
      aria-label={t("terminal.content")}
      className={visible ? "terminal-reader" : "sr-only"}
    >
      {visible && (
        <canvas ref={canvas} width={800} height={600} aria-hidden="true" />
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {frame.title}
      </p>
      <pre className="sr-only">{plainText(frame)}</pre>
      <nav aria-label={t("terminal.sections")}>
        {frame.actions.map((action) => (
          <button key={action.key} onClick={() => choose(onKey, action.key)}>
            {action.label}
          </button>
        ))}
      </nav>
    </section>
  );
}

/** A choice of the page in one press : its number typed alone, then ENVOI. */
function choose(onKey: (key: string) => void, key: string): void {
  if (key.length !== 1) return onKey(key);
  onKey("Annulation");
  onKey(key);
  onKey("Envoi");
}
