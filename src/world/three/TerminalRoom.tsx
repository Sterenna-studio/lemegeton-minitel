import { Suspense } from "react";
import { Minitel } from "../../minitel/Minitel";
import { Table } from "../../scene/Table";
import { RenderWhenReady } from "../../scene/RenderWhenReady";
import { Lighting, bureauLighting, salonLighting, terminatelLighting, type LightingPreset } from "../../scene/Lighting";
import type { ModelEntry } from "../../demo/catalog";
import type { Furniture } from "../../scene/furniture";
import type { CrtEffects } from "../../videotex/renderer";
import type { ScreenSource } from "../../minitel/types";
import type { Room } from "../types";
import { Bureau1982 } from "./rooms/Bureau1982";
import { Salon1950 } from "./rooms/Salon1950";
import { TerminatelHall } from "./rooms/TerminatelHall";

// A room of the world (lot E) : the decor of its era (src/world/three/rooms/),
// its light, and the real terminal of the catalogue on its piece of furniture.
// Floor at y = 0 ; the terminal is lifted by its table or cabinet
// (src/world/terminalView.ts).

const LIGHTING: Record<Room["ambiance"], LightingPreset> = {
  "salon-1950": salonLighting,
  "bureau-1982": bureauLighting,
  terminatel: terminatelLighting,
};

export function TerminalRoom({
  room,
  entry,
  piece,
  lift,
  stand,
  screenSource,
  effects,
  onKey,
  onExit,
  paused,
}: {
  room: Room;
  entry: ModelEntry;
  /** Furniture under a desk terminal ; ignored for a terminal on the floor. */
  piece: Furniture;
  lift: number;
  /** The terminal stands on the room's cabinet (1950 television). */
  stand: boolean;
  screenSource: ScreenSource;
  effects: CrtEffects;
  onKey: (key: string) => void;
  /** Click on the door back to the corridor. */
  onExit?: () => void;
  /** Terminal out of view (the visitor walks to or from it). */
  paused: boolean;
}) {
  return (
    <group>
      {/* The light presets are written around a terminal at the origin. */}
      <group position={[0, lift, 0]}>
        <Lighting preset={LIGHTING[room.ambiance]} paused={paused} />
      </group>
      {room.ambiance === "salon-1950" ? (
        <Salon1950 year={room.era} stand={stand} onExit={onExit} />
      ) : room.ambiance === "bureau-1982" ? (
        <Bureau1982 year={room.era} onExit={onExit} />
      ) : (
        <TerminatelHall year={room.era} onExit={onExit} />
      )}
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
            <RenderWhenReady />
          </Suspense>
        )}
      </group>
    </group>
  );
}
