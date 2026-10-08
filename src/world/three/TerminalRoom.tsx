import { Suspense, useEffect, useMemo } from "react";
import { BackSide, CanvasTexture, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from "three";
import { Minitel } from "../../minitel/Minitel";
import { Table } from "../../scene/Table";
import { Lighting, bureauLighting, salonLighting, terminatelLighting, type LightingPreset } from "../../scene/Lighting";
import { createMarbleCanvas } from "../../demo/marble";
import type { ModelEntry } from "../../demo/catalog";
import type { Furniture } from "../../scene/furniture";
import type { CrtEffects } from "../../videotex/renderer";
import type { ScreenSource } from "../../minitel/types";
import type { Room } from "../types";

// A room of the world (lot E) : its shell, tinted by the era, its light, and
// the real terminal of the catalogue on its piece of furniture. The decor of
// each era (furniture, objects) comes on top. Floor at y = 0 ; the terminal
// is lifted by the table's height (src/world/terminalView.ts).

// 4 × 5 m, 2.8 m high : a room, not a hall, around a terminal of 40 cm.
const ROOM = { width: 32, height: 22.4, depth: 40 };

const SHELLS: Record<Room["ambiance"], { walls: string; floor: string; floorRoughness: number; lighting: LightingPreset }> = {
  "salon-1950": { walls: "#c9b48a", floor: "#6b4f35", floorRoughness: 0.75, lighting: salonLighting },
  "bureau-1982": { walls: "#d6cbb3", floor: "#8c8c84", floorRoughness: 0.95, lighting: bureauLighting },
  terminatel: { walls: "#ffffff", floor: "#0c0b0a", floorRoughness: 0.35, lighting: terminatelLighting },
};

function marbleWalls(): MeshStandardMaterial {
  // Same procedural marble as the Terminatel finish (another seed : no repeat).
  const texture = new CanvasTexture(createMarbleCanvas(1024, 82));
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 1.2);
  return new MeshStandardMaterial({ map: texture, color: "#b5aca2", roughness: 0.4, side: BackSide });
}

export function TerminalRoom({
  room,
  entry,
  piece,
  lift,
  screenSource,
  effects,
  onKey,
  paused,
}: {
  room: Room;
  entry: ModelEntry;
  /** Furniture under a desk terminal ; ignored for a terminal on the floor. */
  piece: Furniture;
  lift: number;
  screenSource: ScreenSource;
  effects: CrtEffects;
  onKey: (key: string) => void;
  /** Terminal out of view (the visitor walks to or from it). */
  paused: boolean;
}) {
  const shell = SHELLS[room.ambiance];
  const walls = useMemo(
    () =>
      room.ambiance === "terminatel"
        ? marbleWalls()
        : new MeshStandardMaterial({ color: shell.walls, roughness: 0.9, side: BackSide }),
    [room.ambiance, shell.walls],
  );
  useEffect(
    () => () => {
      walls.map?.dispose();
      walls.dispose();
    },
    [walls],
  );
  return (
    <group>
      {/* The light presets are written around a terminal at the origin. */}
      <group position={[0, lift, 0]}>
        <Lighting preset={shell.lighting} paused={paused} />
      </group>
      <mesh position={[0, ROOM.height / 2, 0]} material={walls} receiveShadow>
        <boxGeometry args={[ROOM.width, ROOM.height, ROOM.depth]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color={shell.floor} roughness={shell.floorRoughness} />
      </mesh>
      <group position={[0, lift, 0]}>
        <Minitel
          model={entry.file}
          profile={entry.profile}
          finish={entry.finish}
          screenSource={screenSource}
          effects={effects}
          onKey={onKey}
          paused={paused}
        />
        {entry.onTable && piece.file && (
          <Suspense fallback={null}>
            <Table piece={{ ...piece, file: piece.file }} />
          </Suspense>
        )}
      </group>
    </group>
  );
}
