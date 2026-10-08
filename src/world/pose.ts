import { easeInOutCubic, requireStation, travelPath } from "./rails";
import { roomOfStation } from "./rooms";
import { catmullRom } from "./curve";
import { doorSequence, PASSAGE_DURATION, SEQUENCE_DURATION, type DoorState } from "./sequence";
import { durationOf, type NavState } from "./navigation";
import type { DoorSlot, Vec3, World } from "./types";

// What the world shows for a navigation state (docs/MONDE_EXPLORABLE.md, §4-5) :
// the place, the camera, the fade to black and the door in motion. Pure : the
// 3D layer applies it every frame, the tests read it.

export const DEFAULT_FOV = 40;
/** "couloir" or the id of a room. */
export type Place = string;

export interface View {
  place: Place;
  position: Vec3;
  lookAt: Vec3;
  fov: number;
  /** 0 : clear, 1 : black. */
  fade: number;
  /** The door being opened or closed, with its state. */
  door?: { id: string; state: DoorState };
}

export function placeOf(world: World, station: string): Place {
  return roomOfStation(world, station)?.id ?? "couloir";
}

const mix = (a: Vec3, b: Vec3, k: number): Vec3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function still(world: World, station: string, fade = 0): View {
  const s = requireStation(world, station);
  return { place: placeOf(world, station), position: s.position, lookAt: s.lookAt, fov: s.fov ?? DEFAULT_FOV, fade };
}

/** Point just past the doorway, inside the wall : where the passage leads. */
function threshold(slot: DoorSlot, depth: number): Vec3 {
  const inward = slot.side === "gauche" ? -1 : 1;
  return [slot.position[0] + inward * depth, 12.8, slot.position[2]];
}

export function viewOf(world: World, state: NavState): View {
  const corridorYear = world.corridor.year;
  switch (state.mode) {
    case "poste":
      return still(world, state.station);
    case "trajet": {
      const from = requireStation(world, state.from);
      const to = requireStation(world, state.to);
      const k = easeInOutCubic(state.t / state.duration);
      return {
        place: placeOf(world, state.from),
        position: catmullRom(travelPath(from, to), k),
        lookAt: mix(from.lookAt, to.lookAt, k),
        fov: (from.fov ?? DEFAULT_FOV) + ((to.fov ?? DEFAULT_FOV) - (from.fov ?? DEFAULT_FOV)) * k,
        fade: 0,
      };
    }
    case "ouverture":
      return {
        ...still(world, state.door.approach),
        door: { id: state.door.door.id, state: doorSequence(state.t, corridorYear, state.door.door.year) },
      };
    case "passage": {
      // Walk through the open door ; the light swallows the view.
      const start = requireStation(world, state.door.approach);
      const k = easeInOutCubic(state.t / PASSAGE_DURATION);
      return {
        place: "couloir",
        position: mix(start.position, threshold(state.door, 3), k),
        lookAt: mix(start.lookAt, threshold(state.door, 12), k),
        fov: start.fov ?? DEFAULT_FOV,
        fade: clamp01((state.t - 0.5) / (PASSAGE_DURATION - 0.5)),
        door: { id: state.door.door.id, state: doorSequence(SEQUENCE_DURATION, corridorYear, state.door.door.year) },
      };
    }
    case "retour": {
      // Leave the room (fade out), then the door closes behind, seen from the corridor.
      const t = state.t;
      if (t < 0.9) return still(world, state.from, clamp01(t / 0.6));
      return {
        ...still(world, state.door.approach, clamp01(1 - (t - 0.9) / 0.6)),
        door: {
          id: state.door.door.id,
          state: doorSequence(Math.max(0, SEQUENCE_DURATION - t), corridorYear, state.door.door.year),
        },
      };
    }
    case "fondu": {
      // Out of the first place, into the second.
      const k = state.t / durationOf(state);
      return k < 0.5 ? still(world, state.from, k * 2) : still(world, state.to, 2 - k * 2);
    }
  }
}
