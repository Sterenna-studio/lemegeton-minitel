import { Suspense, useEffect, useMemo, type ReactNode } from "react";
import type { BufferGeometry, Material } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { boxes, quad, type BoxSpec } from "../kit";
import { DOOR_FRAME, closedState, freeSpans } from "../Corridor";
import { TemporalDoor } from "../TemporalDoor";
import { RenderWhenReady } from "../../../scene/RenderWhenReady";
import { CORRIDOR_YEAR } from "../../rooms";
import type { Vec3 } from "../../types";

// The four walls of a room, its floor and ceiling, the rails along the walls,
// and the door back to the corridor in the wall behind the visitor (+z).
// Walls are two bands (below and above the chair rail), each merged into one
// mesh : a room's shell costs a handful of draw calls.

/** 4 × 5 m, 2.8 m high : a room, not a hall, around a terminal of 40 cm. */
export const ROOM = { width: 32, height: 22.4, depth: 40 };
/** Height of the chair rail : 1 m. */
export const RAIL = 8;

export interface ShellMaterials {
  lower: Material;
  upper: Material;
  floor: Material;
  ceiling: Material;
  rails: Material;
}

type Wall = { origin: Vec3; u: Vec3; normal: Vec3; length: number; door?: number };

const W = ROOM.width / 2;
const D = ROOM.depth / 2;
// Back (-z), front with the door (+z), left (-x), right (+x).
const WALLS: Wall[] = [
  { origin: [-W, 0, -D], u: [1, 0, 0], normal: [0, 0, 1], length: ROOM.width },
  { origin: [-W, 0, D], u: [1, 0, 0], normal: [0, 0, -1], length: ROOM.width, door: W },
  { origin: [-W, 0, -D], u: [0, 0, 1], normal: [1, 0, 0], length: ROOM.depth },
  { origin: [W, 0, -D], u: [0, 0, 1], normal: [-1, 0, 0], length: ROOM.depth },
];

function railsAlong(wall: Wall, y: number, height: number, depth: number): BoxSpec[] {
  const spans = freeSpans(0, wall.length, wall.door === undefined ? [] : [wall.door]);
  return spans.map(([a, b]) => {
    const middle = (a + b) / 2;
    const at: Vec3 = [
      wall.origin[0] + wall.u[0] * middle + wall.normal[0] * (depth / 2),
      y,
      wall.origin[2] + wall.u[2] * middle + wall.normal[2] * (depth / 2),
    ];
    return { size: wall.u[0] ? [b - a, height, depth] : [depth, height, b - a], at };
  });
}

export function RoomShell({
  materials,
  year,
  chairRail = true,
  onExit,
  children,
}: {
  materials: ShellMaterials;
  /** Year of the room, shown by the counter of its door. */
  year: string;
  chairRail?: boolean;
  /** Click on the door back to the corridor. */
  onExit?: () => void;
  children?: ReactNode;
}) {
  const built = useMemo(() => {
    const lower: BufferGeometry[] = [];
    const upper: BufferGeometry[] = [];
    for (const wall of WALLS) {
      const doors = wall.door === undefined ? [] : [wall.door];
      for (const [a, b] of freeSpans(0, wall.length, doors)) {
        lower.push(quad(wall.origin, wall.u, wall.normal, a, b, 0, RAIL));
        upper.push(quad(wall.origin, wall.u, wall.normal, a, b, RAIL, ROOM.height));
      }
      for (const d of doors)
        upper.push(quad(wall.origin, wall.u, wall.normal, d - DOOR_FRAME.width / 2, d + DOOR_FRAME.width / 2, DOOR_FRAME.height, ROOM.height));
    }
    const rails = boxes(
      WALLS.flatMap((wall) => [
        ...railsAlong(wall, 0.6, 1.2, 0.24),
        ...(chairRail ? railsAlong(wall, RAIL, 0.35, 0.3) : []),
        // Cornice : no door up there, the whole length.
        ...railsAlong({ ...wall, door: undefined }, ROOM.height - 0.45, 0.9, 0.7),
      ]),
    );
    return { lower: mergeGeometries(lower), upper: mergeGeometries(upper), rails };
  }, [chairRail]);
  useEffect(
    () => () => {
      built.lower.dispose();
      built.upper.dispose();
      built.rails.dispose();
    },
    [built],
  );
  const door = useMemo(() => ({ id: `sortie-${year}`, year: CORRIDOR_YEAR, glow: "#ffb46b", plaque: "Couloir" }), [year]);
  return (
    <group>
      <mesh geometry={built.lower} material={materials.lower} receiveShadow />
      <mesh geometry={built.upper} material={materials.upper} receiveShadow />
      <mesh geometry={built.rails} material={materials.rails} />
      <mesh rotation-x={-Math.PI / 2} material={materials.floor} receiveShadow>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, ROOM.height, 0]} material={materials.ceiling}>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
      </mesh>
      {/* The door model faces +z : turned to face the inside of the room. */}
      <group
        position={[0, 0, D]}
        rotation-y={Math.PI}
        onClick={
          onExit &&
          ((event) => {
            event.stopPropagation();
            onExit();
          })
        }
      >
        {/* Its own boundary : the room shows without waiting for the door model. */}
        <Suspense fallback={null}>
          <TemporalDoor door={door} state={closedState(year, CORRIDOR_YEAR)} wall={false} />
          <RenderWhenReady />
        </Suspense>
      </group>
      {children}
    </group>
  );
}
