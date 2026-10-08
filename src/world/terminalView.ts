import type { ModelEntry } from "../demo/catalog";
import { defaultFurniture, type Furniture } from "../scene/furniture";
import { cameraTarget, framings, viewPosition, type Framing } from "../scene/framing";
import type { Vec3 } from "./types";

// Where a terminal stands in its room (lot E). Rooms have their floor at y = 0 ;
// the terminal models have their base at y = 0 and the furniture hangs below
// (src/scene/Table.tsx) : a terminal on a table is lifted by the table's height.
// The terminal station of the room is the default view of the simple version
// (framing reset), so arriving there hands over to the orbit camera seamlessly.

export interface TerminalLayout {
  /** Height of the terminal's base above the room's floor. */
  lift: number;
  framing: Framing;
  /** Centre of the screen, in room coordinates : every view aims at it. */
  target: Vec3;
  /** Pose of the terminal station. */
  view: { position: Vec3; lookAt: Vec3 };
}

export function terminalLayout(entry: ModelEntry, piece: Furniture = defaultFurniture): TerminalLayout {
  const onTable = entry.onTable && piece.file !== null;
  const lift = onTable ? piece.top : 0;
  const framing = framings[onTable ? "desk" : "floor"];
  const screen = cameraTarget(entry.profile);
  const target: Vec3 = [screen[0], screen[1] + lift, screen[2]];
  return { lift, framing, target, view: { position: viewPosition(target, framing.reset.wide), lookAt: target } };
}
