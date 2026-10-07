import { FADE_DURATION, areNeighbours, linksFrom, requireStation, travelDuration } from "./rails";
import { findStation } from "./rooms";
import { PASSAGE_DURATION, SEQUENCE_DURATION } from "./sequence";
import type { DoorSlot, World } from "./types";

// Navigation on the rails as a pure reducer (docs/MONDE_EXPLORABLE.md, §4).
// The 3D layer sends AVANCER with the frame time and renders the state.

interface Base {
  /** Stations reached before, most recent last (for PRECEDENT). */
  history: string[];
}
export type NavState =
  | (Base & { mode: "poste"; station: string })
  | (Base & { mode: "trajet"; from: string; to: string; t: number; duration: number; back: boolean })
  | (Base & { mode: "ouverture"; from: string; door: DoorSlot; t: number })
  | (Base & { mode: "passage"; from: string; door: DoorSlot; t: number })
  | (Base & { mode: "retour"; from: string; door: DoorSlot; t: number })
  | (Base & { mode: "fondu"; from: string; to: string; t: number; back: boolean });

export type NavEvent =
  | { type: "ALLER"; to: string }
  | { type: "PORTE" }
  | { type: "SORTIE" }
  | { type: "SAUT"; to: string }
  | { type: "PRECEDENT" }
  | { type: "AVANCER"; dt: number };

export interface NavOptions {
  /** prefers-reduced-motion : fades instead of travels and sequences. */
  reducedMotion?: boolean;
}

export function initialState(station: string): NavState {
  return { mode: "poste", station, history: [] };
}

/** Station the camera stands at, or leaves from while moving. */
export function currentStation(state: NavState): string {
  return state.mode === "poste" ? state.station : state.from;
}

/** Duration of the current movement, in seconds (0 at a station). */
export function durationOf(state: NavState): number {
  switch (state.mode) {
    case "poste":
      return 0;
    case "trajet":
      return state.duration;
    case "ouverture":
    case "retour":
      return SEQUENCE_DURATION;
    case "passage":
      return PASSAGE_DURATION;
    case "fondu":
      return FADE_DURATION;
  }
}

function arrive(state: NavState, to: string, from: string, back: boolean): NavState {
  const history = back ? state.history.slice(0, -1) : [...state.history, from];
  return { mode: "poste", station: to, history };
}

function entryOf(world: World, door: DoorSlot): string {
  const to = door.to;
  const room = to.kind === "salle" ? world.rooms.find((r) => r.id === to.room) : undefined;
  if (!room) throw new Error(`Porte sans salle : ${door.door.id}`);
  return room.entry;
}

function fade(state: NavState & { mode: "poste" }, to: string, back = false): NavState {
  return { mode: "fondu", from: state.station, to, t: 0, back, history: state.history };
}

function go(world: World, state: NavState & { mode: "poste" }, to: string, options: NavOptions, back = false): NavState {
  if (options.reducedMotion) return fade(state, to, back);
  const duration = travelDuration(requireStation(world, state.station), requireStation(world, to));
  return { mode: "trajet", from: state.station, to, t: 0, duration, back, history: state.history };
}

export function navigate(world: World, state: NavState, event: NavEvent, options: NavOptions = {}): NavState {
  if (event.type === "AVANCER") {
    if (state.mode === "poste") return state;
    const t = state.t + Math.max(0, event.dt);
    if (t < durationOf(state)) return { ...state, t };
    switch (state.mode) {
      case "trajet":
      case "fondu":
        return arrive(state, state.to, state.from, state.back);
      case "ouverture":
        return { mode: "passage", from: state.from, door: state.door, t: 0, history: state.history };
      case "passage":
        return arrive(state, entryOf(world, state.door), state.from, false);
      case "retour":
        return arrive(state, state.door.approach, state.from, false);
    }
  }
  // Commands are ignored while moving.
  if (state.mode !== "poste") return state;
  const links = linksFrom(world, state.station);
  switch (event.type) {
    case "ALLER": {
      const allowed = links.some((link) => link.kind === "aller" && link.to === event.to);
      return allowed ? go(world, state, event.to, options) : state;
    }
    case "PORTE": {
      const link = links.find((l) => l.kind === "porte");
      if (!link || link.kind !== "porte") return state;
      if (options.reducedMotion) return fade(state, entryOf(world, link.door));
      return { mode: "ouverture", from: state.station, door: link.door, t: 0, history: state.history };
    }
    case "SORTIE": {
      const link = links.find((l) => l.kind === "sortie");
      if (!link || link.kind !== "sortie") return state;
      if (options.reducedMotion) return fade(state, link.door.approach);
      return { mode: "retour", from: state.station, door: link.door, t: 0, history: state.history };
    }
    case "SAUT":
      return findStation(world, event.to) && event.to !== state.station ? fade(state, event.to) : state;
    case "PRECEDENT": {
      const previous = state.history[state.history.length - 1];
      if (!previous) return state;
      return areNeighbours(world, state.station, previous)
        ? go(world, state, previous, options, true)
        : fade(state, previous, true);
    }
  }
}
