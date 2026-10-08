import { useEffect, useMemo } from "react";
import { BackSide, CanvasTexture, SRGBColorSpace } from "three";
import type { Room } from "../types";

// Provisional room (lot D) : a box tinted by its era and a plinth that
// announces the room. Lot E puts the terminal and the decor in its place.

const TINTS: Record<Room["ambiance"], { walls: string; floor: string; text: string }> = {
  "salon-1950": { walls: "#c9b48a", floor: "#6b4f35", text: "#2a1f12" },
  "bureau-1982": { walls: "#d6cbb3", floor: "#8c8c84", text: "#2a2520" },
  terminatel: { walls: "#1b1712", floor: "#0c0b0a", text: "#ece4d2" },
};

export function RoomPlaceholder({ room }: { room: Room }) {
  const tint = TINTS[room.ambiance];
  const label = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = tint.walls;
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = tint.text;
    ctx.textAlign = "center";
    ctx.font = '600 76px "IBM Plex Sans", sans-serif';
    // The year once : "Televiseur 1950" already carries it, "Minitel 1" does not.
    ctx.fillText(room.label.includes(room.era) ? room.label : `${room.label} · ${room.era}`, 512, 110);
    ctx.font = '500 40px "IBM Plex Mono", monospace';
    ctx.fillText("salle en préparation (lot E)", 512, 190);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [room.label, room.era, tint]);
  useEffect(() => () => label.dispose(), [label]);
  return (
    <group>
      <hemisphereLight args={["#fff3dc", "#3a2e22", 1.6]} />
      <pointLight position={[0, 18, 10]} intensity={260} decay={2} distance={80} color="#ffe2bd" />
      <mesh position={[0, 11.2, 0]}>
        <boxGeometry args={[40, 22.4, 56]} />
        <meshStandardMaterial color={tint.walls} roughness={0.9} side={BackSide} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <planeGeometry args={[40, 56]} />
        <meshStandardMaterial color={tint.floor} roughness={0.8} />
      </mesh>
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[6, 6, 4]} />
        <meshStandardMaterial color={tint.floor} roughness={0.6} />
      </mesh>
      <mesh position={[0, 10.5, -6]}>
        <planeGeometry args={[16, 4]} />
        <meshBasicMaterial map={label} toneMapped={false} />
      </mesh>
    </group>
  );
}
