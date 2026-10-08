import { useState } from "react";
import { X } from "lucide-react";
import { Tool } from "../components/Tool";
import { AccessibleTerminal } from "../components/AccessibleTerminal";
import { furniture } from "../scene/furniture";
import { SettingsPanel } from "../terminal/SettingsPanel";
import { TerminalConsole, VirtualKeyboard, closedPanels, togglePanel, type ConsolePanels } from "../terminal/TerminalConsole";
import { useTerminalKeyboard, type TerminalExperience } from "../terminal/useTerminalExperience";

// In front of a terminal (decision of 2026-10-07) : the 3615 console, the
// settings (CRT, eyes, furniture), the on-screen keyboard and the accessible
// reading, the same pieces as the simple version. The physical keyboard goes
// to the terminal here.

export function TerminalStation({
  experience,
  furnitureChoice,
}: {
  experience: TerminalExperience;
  /** Furniture choice, for a desk terminal. */
  furnitureChoice?: { selected: string; onChoose: (id: string) => void };
}) {
  const { activeFrame, sendKey, goTo } = experience;
  const [panels, setPanels] = useState<ConsolePanels>(closedPanels);
  useTerminalKeyboard(sendKey);
  return (
    <div className="world-terminal">
      {panels.reader && (
        <aside className="reader-panel">
          <div className="panel-title">
            <h2>{activeFrame.title}</h2>
            <Tool label="Fermer la lecture" onClick={() => setPanels((current) => ({ ...current, reader: false }))}>
              <X size={18} />
            </Tool>
          </div>
          <AccessibleTerminal frame={activeFrame} visible onKey={sendKey} />
        </aside>
      )}
      {!panels.reader && <AccessibleTerminal frame={activeFrame} visible={false} onKey={sendKey} />}
      {panels.settings && (
        <SettingsPanel
          experience={experience}
          onClose={() => setPanels((current) => ({ ...current, settings: false }))}
          furniture={furnitureChoice && { pieces: furniture, ...furnitureChoice }}
        />
      )}
      {panels.keyboard && <VirtualKeyboard sendKey={sendKey} />}
      <TerminalConsole
        frame={activeFrame}
        panels={panels}
        onToggle={(name) => setPanels((current) => togglePanel(current, name))}
        sendKey={sendKey}
        goTo={goTo}
      />
    </div>
  );
}
