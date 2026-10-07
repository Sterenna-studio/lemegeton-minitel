import type { Ambiance, Corridor, Room, Station, TemporalDoor, World } from "./types";

// The world is derived from the catalogue : one room and one temporal door per
// terminal (decision of 2026-10-06). Adding a ModelEntry adds both.

/** What the world needs from a catalogue entry (a ModelEntry fits). */
export type TerminalEntry = { id: string; label: string };

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

// Provisional layout, refined with the corridor kit (lot C). The corridor runs
// along -z from the entry ; eyes at 1.6 m (12.8 units) ; one door every 4 m
// (32 units), alternating left and right.
const EYE = 12.8;
const DOOR_SPACING = 32;
const DOOR_X = 6.4;

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
  const stations: Station[] = [
    {
      id: `${prefix}:entree`,
      label: `Entrée — ${entry.label}`,
      position: [0, EYE, 24],
      lookAt: [0, EYE * 0.6, 0],
    },
    {
      // Placeholder : at an inspect station the current camera framing applies.
      id: `${prefix}:terminal`,
      label: entry.label,
      position: [0, EYE * 0.6, 12],
      lookAt: [0, EYE * 0.4, 0],
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
    { id: "couloir:entree", label: "Entrée du couloir", position: [0, EYE, 0], lookAt: [0, EYE, -40] },
  ];
  const doors = ordered.map((entry, index) => {
    const side = index % 2 === 0 ? "gauche" : "droite";
    const z = -DOOR_SPACING * (index + 1);
    const x = side === "gauche" ? -DOOR_X : DOOR_X;
    const approach = `couloir:porte-${entry.id}`;
    stations.push({
      id: approach,
      label: `Porte ${eraOf(entry).year}`,
      position: [0, EYE, z],
      lookAt: [x, EYE * 0.85, z],
    });
    const door: TemporalDoor = {
      id: `porte-${entry.id}`,
      year: eraOf(entry).year,
      glow: eraOf(entry).glow,
      plaque: entry.label,
    };
    return { door, to: { kind: "salle" as const, room: entry.id }, approach, side: side as "gauche" | "droite" };
  });
  const end = -DOOR_SPACING * (ordered.length + 1);
  stations.push({ id: "couloir:fond", label: "Fond du couloir", position: [0, EYE, end], lookAt: [0, EYE, end - 40] });
  return { year: CORRIDOR_YEAR, stations, doors };
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
