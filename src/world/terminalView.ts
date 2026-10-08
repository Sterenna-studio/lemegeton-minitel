import type { ModelEntry } from "../demo/catalog";
import { defaultFurniture, type Furniture } from "../scene/furniture";
import { cameraTarget, framings, viewPosition, type Framing } from "../scene/framing";
import type { Vec3 } from "./types";

// Where a terminal stands in its room (lot E). Rooms have their floor at y = 0 ;
// the terminal models have their base at y = 0 and the furniture hangs below
// (src/scene/Table.tsx) : a terminal on a table is lifted by the table's height.
// A terminal made for the floor (the 1950 television, 45 cm wide) stands on
// the room's own low cabinet (src/world/three/rooms/Salon1950.tsx).
// The terminal station of the room is the default view of the simple version
// (framing reset, wide or narrow like src/scene/Camera.tsx), so arriving there
// hands over to the orbit camera seamlessly.

/** Top of the cabinet under a floor terminal : 60 cm. */
export const STAND_TOP = 4.8;

export interface TerminalLayout {
  /** Height of the terminal's base above the room's floor. */
  lift: number;
  /** The terminal stands on the room's cabinet (not on a piece of furniture). */
  stand: boolean;
  framing: Framing;
  /** Centre of the screen, in room coordinates : every view aims at it. */
  target: Vec3;
  /** Pose of the terminal station. */
  view: { position: Vec3; lookAt: Vec3 };
}

export function terminalLayout(entry: ModelEntry, piece: Furniture = defaultFurniture, narrow = false): TerminalLayout {
  const onTable = entry.onTable && piece.file !== null;
  const stand = !entry.onTable;
  const lift = onTable ? piece.top : stand ? STAND_TOP : 0;
  const framing = framings[onTable ? "desk" : "floor"];
  const screen = cameraTarget(entry.profile);
  const target: Vec3 = [screen[0], screen[1] + lift, screen[2]];
  const offset = narrow ? framing.reset.narrow : framing.reset.wide;
  return { lift, stand, framing, target, view: { position: viewPosition(target, offset), lookAt: target } };
}
