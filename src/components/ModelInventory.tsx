import type { KeyboardEvent } from "react";
import type { ModelEntry } from "../demo/catalog";
import { assetUrl } from "../assets";


/**
 * Inventory cards : one per model, a cut-out miniature over its material. The
 * group behaves as a radio group (click, arrows). The 3D lift on hover and
 * focus is plain CSS (perspective + transforms), see `.inventory` in styles.css.
 */
export function ModelInventory({
  entries,
  selected,
  onSelect,
}: {
  entries: ModelEntry[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  function onKeyDown(event: KeyboardEvent) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const index = entries.findIndex((entry) => entry.id === selected);
    const next = entries[(index + step + entries.length) % entries.length];
    onSelect(next.id);
    document.getElementById(`model-${next.id}`)?.focus();
  }
  return (
    <div className="inventory" role="radiogroup" aria-label="Modele 3D" onKeyDown={onKeyDown}>
      {entries.map((entry, index) => {
        const checked = entry.id === selected;
        return (
          <button
            key={entry.id}
            id={`model-${entry.id}`}
            className={`inventory-card inventory-${entry.id}`}
            role="radio"
            aria-checked={checked}
            tabIndex={checked || (!selected && index === 0) ? 0 : -1}
            onClick={() => onSelect(entry.id)}
          >
            <span className="inventory-back" aria-hidden="true" />
            <img src={assetUrl(`inventaire/${entry.id}.png`)} alt="" draggable={false} />
            <span className="inventory-caption">{entry.label}</span>
          </button>
        );
      })}
    </div>
  );
}
