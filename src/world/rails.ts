import { findStation, roomOfStation } from "./rooms";
import type { DoorSlot, Station, Vec3, World } from "./types";

// Rails (docs/MONDE_EXPLORABLE.md, §4) : the camera only moves from a station
// to a neighbour. The graph is computed from the data, never written by hand.

/** Walking pace : 12 units/s, about 1.5 m/s. */
export const TRAVEL_SPEED = 12;
export const MIN_TRAVEL = 0.8;
export const MAX_TRAVEL = 2.5;
/** Fade replacing travels and sequences with reduced motion, in seconds. */
export const FADE_DURATION = 0.4;

export type Link =
  | { kind: "aller"; to: string }
  | { kind: "porte"; door: DoorSlot }
  | { kind: "sortie"; door: DoorSlot };

/** Possible moves from a station, in display order. */
export function linksFrom(world: World, stationId: string): Link[] {
  const corridor = world.corridor.stations.map((s) => s.id);
  const index = corridor.indexOf(stationId);
  if (index >= 0) {
    const links: Link[] = [];
    const door = world.corridor.doors.find((slot) => slot.approach === stationId);
    if (door) links.push({ kind: "porte", door });
    if (index + 1 < corridor.length) links.push({ kind: "aller", to: corridor[index + 1] });
    if (index > 0) links.push({ kind: "aller", to: corridor[index - 1] });
    return links;
  }
  const room = roomOfStation(world, stationId);
  if (!room) return [];
  const door = world.corridor.doors.find((slot) => slot.to.kind === "salle" && slot.to.room === room.id);
  if (stationId === room.entry) {
    const links: Link[] = [{ kind: "aller", to: room.terminalStation }];
    if (door) links.push({ kind: "sortie", door });
    return links;
  }
  // Every other station of a room leads back to its entry.
  return [{ kind: "aller", to: room.entry }];
}

/** Station reached by a link. */
export function targetOf(world: World, link: Link): string {
  if (link.kind === "aller") return link.to;
  if (link.kind === "sortie") return link.door.approach;
  const to = link.door.to;
  const room = to.kind === "salle" ? world.rooms.find((r) => r.id === to.room) : undefined;
  if (!room) throw new Error(`Porte sans salle : ${link.door.door.id}`);
  return room.entry;
}

export function areNeighbours(world: World, from: string, to: string): boolean {
  return linksFrom(world, from).some((link) => targetOf(world, link) === to);
}

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Travel duration in seconds, proportional to the distance, clamped. */
export function travelDuration(from: Station, to: Station): number {
  return Math.min(MAX_TRAVEL, Math.max(MIN_TRAVEL, distance(from.position, to.position) / TRAVEL_SPEED));
}

/** Smooth start and stop. */
export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

/**
 * Control points of a travel inside one place (corridor or room) : the two
 * stations, with an intermediate point lifted halfway so that the curve
 * (CatmullRomCurve3 in the 3D layer) does not cut corners.
 */
export function travelPath(from: Station, to: Station): Vec3[] {
  const mid: Vec3 = [
    (from.position[0] + to.position[0]) / 2,
    (from.position[1] + to.position[1]) / 2,
    (from.position[2] + to.position[2]) / 2,
  ];
  return [from.position, mid, to.position];
}

export function requireStation(world: World, id: string): Station {
  const station = findStation(world, id);
  if (!station) throw new Error(`Poste inconnu : ${id}`);
  return station;
}
