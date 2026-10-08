import type { Vec3 } from "../minitel/types";

// Data model of the explorable world (docs/MONDE_EXPLORABLE.md, §3).
// Units : 1 m = 8. Station ids are global : "couloir:<id>" or
// "salle:<room>:<id>".

export type { Vec3 };

/** A fixed point of view of the rails. */
export interface Station {
  id: string;
  label: string;
  position: Vec3;
  lookAt: Vec3;
  fov?: number;
  /** Orbit allowed (in front of a terminal) : the current camera takes over. */
  inspect?: boolean;
}

export interface TemporalDoor {
  id: string;
  /** Target year on the roller counter : "1950", "1982", "198?". */
  year: string;
  /** Tint of the era, filtering under the door (DIRECTION_ARTISTIQUE.md). */
  glow: string;
  /** Engraved plate : the terminal's name. */
  plaque: string;
}

export type Destination =
  | { kind: "salle"; room: string }
  | { kind: "page"; href: string }
  | { kind: "externe"; href: string }
  | { kind: "minitel"; service: string };

export interface DoorSlot {
  door: TemporalDoor;
  to: Destination;
  /** Corridor station facing the door. */
  approach: string;
  side: "gauche" | "droite";
  /** Bottom centre of the frame, in the wall. */
  position: Vec3;
  /** Turn of the door around y : the door model faces +z. */
  rotationY: number;
}

export interface Corridor {
  /** Year shown by the counters while in the corridor (out of time). */
  year: string;
  /** Inner volume : x from -width/2 to width/2, y from 0 to height, z from start down to end. */
  bounds: { width: number; height: number; start: number; end: number };
  stations: Station[];
  doors: DoorSlot[];
}

export type Ambiance = "salon-1950" | "bureau-1982" | "terminatel";

export interface Room {
  id: string;
  /** Catalogue entry shown in the room (ModelEntry.id). */
  terminal: string;
  label: string;
  era: string;
  ambiance: Ambiance;
  stations: Station[];
  /** Station where one arrives through the door. */
  entry: string;
  /** Station in front of the terminal (inspect). */
  terminalStation: string;
}

export interface World {
  corridor: Corridor;
  rooms: Room[];
}
