import { findStation } from "./rooms";
import type { World } from "./types";

// Place <-> URL (docs/MONDE_EXPLORABLE.md, §4) : ?salle=<room>&poste=<id>.
// No salle : the corridor ; no poste : the entry. Old links ?modele=<id> open
// the terminal station of that room.

export const CORRIDOR_ENTRY = "couloir:entree";

export function stationFromParams(world: World, params: URLSearchParams): string {
  const room = params.get("salle") ?? params.get("modele");
  const local = params.get("poste") ?? (params.has("salle") ? "entree" : params.has("modele") ? "terminal" : null);
  const id = room ? `salle:${room}:${local ?? "entree"}` : `couloir:${local ?? "entree"}`;
  return findStation(world, id) ? id : CORRIDOR_ENTRY;
}

/** Parameters describing a station ; null removes a parameter. */
export function paramsForStation(station: string): Record<string, string | null> {
  const parts = station.split(":");
  if (parts[0] === "salle") return { salle: parts[1], poste: parts[2] === "entree" ? null : parts[2], modele: null };
  return { salle: null, poste: parts[1] === "entree" ? null : parts[1], modele: null };
}
