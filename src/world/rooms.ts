import type { Ambiance, Corridor, Room, Station, TemporalDoor, Vec3, World } from "./types";

// The world is derived from the catalogue : one room and one temporal door per
// terminal (decision of 2026-10-06). Adding a ModelEntry adds both.

/** What the world needs from a catalogue entry (a ModelEntry fits). */
export type TerminalEntry = {
  id: string;
  label: string;
  /** Pose of the terminal station (src/world/terminalView.ts) ; a default otherwise. */
  terminalView?: { position: Vec3; lookAt: Vec3 };
};

interface Era {
  year: string;
  ambiance: Ambiance;
  /** Tint of the era (docs/DIRECTION_ARTISTIQUE.md). */
  glow: string;
}

/** World-specific details, keyed by catalogue id. */
export const ERAS: Record<string, Era> = {
  "televiseur-1950": { year: "1950", ambiance: "salon-1950", glow: "#8fd1c4" },
  "minitel-1": { year: "1982", ambiance: "bureau-1982", glow: "#e8e2c8" },
  // No public source dates the Terminatel 255 : its counter stays a mystery.
  "terminatel-255": { year: "198?", ambiance: "terminatel", glow: "#ff9a4d" },
};

/** Year shown in the corridor, out of time. */
export const CORRIDOR_YEAR = "19??";

// Corridor layout (lot C). It runs along -z from the entry : 1.6 m wide and
// 2.8 m high (12.8 × 22.4 units), eyes at 1.6 m (12.8), one door every 4 m
// (32 units), alternating left and right, set in the walls.
// A 2.46 m door seen from the middle of a 1.6 m corridor would hardly fit the
// view : the station facing a door stands against the opposite wall, 1.4 m
// away (11 units), with a wider field of view (60°).
export const CORRIDOR_WIDTH = 12.8;
export const CORRIDOR_HEIGHT = 22.4;
const EYE = 12.8;
const DOOR_SPACING = 32;
const DOOR_X = CORRIDOR_WIDTH / 2;
/** Camera standing in front of a door, against the opposite wall. */
const FACING_X = 4.6;
/** Height the views aim at : handle and counter of the door. */
const DOOR_AIM = 11;
const CORRIDOR_FOV = 60;

export function eraOf(entry: TerminalEntry): Era {
  return ERAS[entry.id] ?? { year: "19??", ambiance: "terminatel", glow: "#ff9a4d" };
}

/**
 * Chronological order. Code-point comparison on purpose : "198?" sorts after
 * "1982" ("?" > digits), whereas localeCompare puts punctuation first.
 */
export function chronological(entries: TerminalEntry[]): TerminalEntry[] {
  const year = (entry: TerminalEntry) => eraOf(entry).year;
  return [...entries].sort((a, b) => (year(a) < year(b) ? -1 : year(a) > year(b) ? 1 : 0));
}

function roomOf(entry: TerminalEntry): Room {
  const era = eraOf(entry);
  const prefix = `salle:${entry.id}`;
  const terminal = entry.terminalView ?? { position: [0, EYE * 0.6, 12] as Vec3, lookAt: [0, EYE * 0.4, 0] as Vec3 };
  const stations: Station[] = [
    {
      // From the doorway : the room and its terminal.
      id: `${prefix}:entree`,
      label: `Entrée — ${entry.label}`,
      position: [0, EYE, 17],
      lookAt: terminal.lookAt,
      fov: 55,
    },
    {
      // In front of the terminal : the orbit camera of the simple version takes over.
      id: `${prefix}:terminal`,
      label: entry.label,
      position: terminal.position,
      lookAt: terminal.lookAt,
      inspect: true,
    },
  ];
  return {
    id: entry.id,
    terminal: entry.id,
    label: entry.label,
    era: era.year,
    ambiance: era.ambiance,
    stations,
    entry: `${prefix}:entree`,
    terminalStation: `${prefix}:terminal`,
  };
}

function corridorOf(entries: TerminalEntry[]): Corridor {
  const ordered = chronological(entries);
  const stations: Station[] = [
    { id: "couloir:entree", label: "Entrée du couloir", position: [0, EYE, 6], lookAt: [0, DOOR_AIM + 0.5, -40], fov: CORRIDOR_FOV },
  ];
  const doors = ordered.map((entry, index) => {
    const side = index % 2 === 0 ? "gauche" : "droite";
    const z = -DOOR_SPACING * (index + 1);
    const x = side === "gauche" ? -DOOR_X : DOOR_X;
    const approach = `couloir:porte-${entry.id}`;
    stations.push({
      id: approach,
      label: `Porte ${eraOf(entry).year}`,
      position: [side === "gauche" ? FACING_X : -FACING_X, EYE, z],
      lookAt: [x, DOOR_AIM, z],
      fov: CORRIDOR_FOV,
    });
    const door: TemporalDoor = {
      id: `porte-${entry.id}`,
      year: eraOf(entry).year,
      glow: eraOf(entry).glow,
      plaque: entry.label,
    };
    return {
      door,
      to: { kind: "salle" as const, room: entry.id },
      approach,
      side: side as "gauche" | "droite",
      position: [x, 0, z] as [number, number, number],
      // The door model faces +z : turn it to face the inside of the corridor.
      rotationY: side === "gauche" ? Math.PI / 2 : -Math.PI / 2,
    };
  });
  const end = -DOOR_SPACING * (ordered.length + 1);
  stations.push({ id: "couloir:fond", label: "Fond du couloir", position: [0, EYE, end + 18], lookAt: [0, DOOR_AIM, end], fov: CORRIDOR_FOV });
  return {
    year: CORRIDOR_YEAR,
    bounds: { width: CORRIDOR_WIDTH, height: CORRIDOR_HEIGHT, start: 14, end },
    stations,
    doors,
  };
}

export function buildWorld(entries: TerminalEntry[]): World {
  return { corridor: corridorOf(entries), rooms: chronological(entries).map(roomOf) };
}

export function allStations(world: World): Station[] {
  return [...world.corridor.stations, ...world.rooms.flatMap((room) => room.stations)];
}

export function findStation(world: World, id: string): Station | undefined {
  return allStations(world).find((station) => station.id === id);
}

export function roomOfStation(world: World, id: string): Room | undefined {
  return world.rooms.find((room) => id.startsWith(`salle:${room.id}:`));
}
