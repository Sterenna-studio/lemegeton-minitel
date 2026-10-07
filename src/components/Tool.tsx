import type { ReactNode } from "react";

/** Square icon button with a tooltip, shared by every panel. */
export function Tool({
  label,
  children,
  onClick,
  active = false,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      className={`icon-button ${active ? "active" : ""}`}
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
      <span className="tooltip">{label}</span>
    </button>
  );
}
