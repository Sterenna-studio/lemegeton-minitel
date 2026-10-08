import { useEffect, useMemo } from "react";
import { BoxGeometry, BufferGeometry, MeshStandardMaterial } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useKtx2Textures } from "../../scene/loaders";
import { TILE, material, quad, textureSet } from "./kit";
import { doorSequence, type DoorState } from "../sequence";
import type { Corridor as CorridorData, DoorSlot, Vec3 } from "../types";
import { TemporalDoor } from "./TemporalDoor";
import { GrandfatherClock } from "./GrandfatherClock";

// The corridor out of time (lot C, docs/DIRECTION_ARTISTIQUE.md) : dark wood
// wainscot up to 1 m, aged wallpaper tinted bottle green above, herringbone
// parquet, plaster ceiling, dark wood rails, brass sconces. Built in code from
// the corridor data (src/world/rooms.ts) : walls are strips between the doors,
// merged into one mesh per material (few draw calls).

/** Frame of the door model (tools/prepare_door.mjs), in units. */
export const DOOR_FRAME = { width: 10.13, height: 19.68 };
export const WAINSCOT = 8;

/** Spans of a wall left free by the doors, between `from` and `to` (along u). */
export function freeSpans(from: number, to: number, doors: number[]): [number, number][] {
  const half = DOOR_FRAME.width / 2;
  const cuts = [...doors].sort((a, b) => a - b).map((d) => [d - half, d + half] as const);
  const spans: [number, number][] = [];
  let start = from;
  for (const [a, b] of cuts) {
    if (a > start) spans.push([start, a]);
    start = Math.max(start, b);
  }
  if (start < to) spans.push([start, to]);
  return spans;
}

export function Corridor({
  data,
  doorStates,
  clockSpeed,
  onDoor,
}: {
  data: CorridorData;
  /** State of each door, by door id (closed when absent). */
  doorStates: Record<string, DoorState>;
  clockSpeed: number;
  /** Click on a door (the world decides what it means). */
  onDoor?: (slot: DoorSlot) => void;
}) {
  const textures = useKtx2Textures(["dark_paneled_wood", "decrepit_wallpaper", "herringbone_parquet"].flatMap(textureSet));
  const { width, height, start, end } = data.bounds;
  const built = useMemo(() => {
    const half = width / 2;
    const length = start - end;
    const wainscot: BufferGeometry[] = [];
    const paper: BufferGeometry[] = [];
    // Side walls : u runs along -z from the entry ; doors cut both bands.
    for (const side of ["gauche", "droite"] as const) {
      const x = side === "gauche" ? -half : half;
      const normal: Vec3 = [side === "gauche" ? 1 : -1, 0, 0];
      const doors = data.doors.filter((slot) => slot.side === side).map((slot) => start - slot.position[2]);
      for (const [a, b] of freeSpans(0, length, doors)) {
        wainscot.push(quad([x, 0, start], [0, 0, -1], normal, a, b, 0, WAINSCOT));
        paper.push(quad([x, 0, start], [0, 0, -1], normal, a, b, WAINSCOT, height));
      }
      // Above the doors : lintel strip of wallpaper.
      for (const d of doors)
        paper.push(quad([x, 0, start], [0, 0, -1], normal, d - DOOR_FRAME.width / 2, d + DOOR_FRAME.width / 2, DOOR_FRAME.height, height));
    }
    // End walls : behind the entry (facing -z) and at the far end (facing +z).
    for (const [z, normal] of [
      [start, [0, 0, -1]],
      [end, [0, 0, 1]],
    ] as [number, Vec3][]) {
      wainscot.push(quad([-half, 0, z], [1, 0, 0], normal, 0, width, 0, WAINSCOT));
      paper.push(quad([-half, 0, z], [1, 0, 0], normal, 0, width, WAINSCOT, height));
    }
    // Rails : baseboard, chair rail at 1 m, cornice under the ceiling.
    const rails: BufferGeometry[] = [];
    for (const side of [-1, 1]) {
      const x = side * (half - 0.12);
      for (const [y, h, depth] of [
        [0.6, 1.2, 0.24],
        [WAINSCOT, 0.35, 0.3],
      ]) {
        const doors = data.doors.filter((slot) => Math.sign(slot.position[0]) === side).map((slot) => start - slot.position[2]);
        for (const [a, b] of freeSpans(0, length, doors)) {
          const box = new BoxGeometry(depth, h, b - a);
          box.translate(x, y, start - (a + b) / 2);
          rails.push(box);
        }
      }
      const cornice = new BoxGeometry(0.7, 0.9, length);
      cornice.translate(side * (half - 0.35), height - 0.45, (start + end) / 2);
      rails.push(cornice);
    }
    return {
      wainscot: mergeGeometries(wainscot),
      paper: mergeGeometries(paper),
      rails: mergeGeometries(rails),
      length,
    };
  }, [data, width, height, start, end]);
  const materials = useMemo(() => {
    const [wood, woodNormal, woodArm, paperMap, paperNormal, paperArm, floor, floorNormal, floorArm] = textures;
    return {
      wainscot: material([wood, woodNormal, woodArm], "#d8c3ad"),
      paper: material([paperMap, paperNormal, paperArm], "#7f9a84"),
      floor: material([floor, floorNormal, floorArm], "#8c6a4c"),
      ceiling: new MeshStandardMaterial({ color: "#cfc3a8", roughness: 0.95 }),
      rails: new MeshStandardMaterial({ color: "#3b2a1e", roughness: 0.55 }),
      brass: new MeshStandardMaterial({ color: "#b08d57", roughness: 0.35, metalness: 0.85 }),
      bulb: new MeshStandardMaterial({ color: "#ffd59a", emissive: "#ffb46b", emissiveIntensity: 2.2 }),
    };
  }, [textures]);
  useEffect(
    () => () => {
      Object.values(materials).forEach((m) => m.dispose());
      built.wainscot.dispose();
      built.paper.dispose();
      built.rails.dispose();
    },
    [materials, built],
  );
  // Sconces : on the walls opposite the doors, and one above the clock.
  const sconces: { position: Vec3; facing: number }[] = [
    ...data.doors.map((slot) => ({
      position: [slot.side === "gauche" ? width / 2 - 0.3 : -width / 2 + 0.3, 16, slot.position[2]] as Vec3,
      facing: slot.side === "gauche" ? -1 : 1,
    })),
    { position: [0, 18, end + 0.3], facing: 0 },
  ];
  return (
    <group>
      <mesh geometry={built.wainscot} material={materials.wainscot} receiveShadow />
      <mesh geometry={built.paper} material={materials.paper} receiveShadow />
      <mesh geometry={built.rails} material={materials.rails} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (start + end) / 2]} material={materials.floor} receiveShadow>
        <planeGeometry args={[width, built.length]} />
      </mesh>
      {/* Floor UVs : planeGeometry spans 0-1 ; scale them to half-metre tiles
          (chevrons at a real scale). */}
      <FloorUv length={built.length} width={width} material={materials.floor} />
      <mesh rotation-x={Math.PI / 2} position={[0, height, (start + end) / 2]} material={materials.ceiling}>
        <planeGeometry args={[width, built.length]} />
      </mesh>
      {sconces.map(({ position, facing }, i) => (
        <group key={i} position={position}>
          <mesh material={materials.brass} position={[facing * -0.15, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.45, 0.3, 16]} />
          </mesh>
          <mesh material={materials.bulb} position={[facing * 0.45, 0.4, 0]}>
            <sphereGeometry args={[0.35, 16, 12]} />
          </mesh>
          <pointLight position={[facing * 0.9, 0.2, 0]} color="#ffb46b" intensity={170} decay={2} distance={64} />
        </group>
      ))}
      {data.doors.map((slot) => (
        <group
          key={slot.door.id}
          position={slot.position}
          rotation-y={slot.rotationY}
          onClick={
            onDoor &&
            ((event) => {
              event.stopPropagation();
              onDoor(slot);
            })
          }
        >
          <TemporalDoor door={slot.door} state={doorStates[slot.door.id] ?? closedState(data.year, slot.door.year)} wall={false} />
        </group>
      ))}
      <GrandfatherClock speed={clockSpeed} position={[0, 0, end + 2.6]} />
    </group>
  );
}

/** Tiles the floor in world units (planeGeometry UVs run 0-1). */
function FloorUv({ length, width, material }: { length: number; width: number; material: MeshStandardMaterial }) {
  useEffect(() => {
    for (const map of [material.map, material.normalMap, material.aoMap])
      if (map) map.repeat.set((width / TILE) * 2, (length / TILE) * 2);
  }, [length, width, material]);
  return null;
}

const closed = new Map<string, DoorState>();
export function closedState(from: string, to: string): DoorState {
  const key = `${from}>${to}`;
  if (!closed.has(key)) closed.set(key, doorSequence(0, from, to));
  return closed.get(key)!;
}
