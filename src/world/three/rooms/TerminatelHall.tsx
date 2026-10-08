import { CanvasTexture, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace, SphereGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createMarbleCanvas } from "../../../demo/marble";
import { boxes } from "../kit";
import { ROOM, RoomShell } from "./RoomShell";
import { post, rope } from "./props";
import { plaqueTexture } from "./textures";
import { useOwned } from "./useOwned";
import type { Vec3 } from "../../types";

// The room of the Terminatel 255 (lot E) : the look of the simple version made
// into a place. Black marble walls (same procedural marble as the terminal's
// finish, another seed), polished black floor, brass rails, two brass sconces,
// an engraved plate, and brass stanchions with a red rope, as for a piece of
// a collection.

const SCONCES: { position: Vec3; facing: 1 | -1 }[] = [
  { position: [-ROOM.width / 2 + 0.3, 15, -7], facing: 1 },
  { position: [ROOM.width / 2 - 0.3, 15, -7], facing: -1 },
];
// Around the sides and the back of the terminal : the front stays open to the
// camera (the views of src/scene/framing.ts look from +z).
const POSTS: [number, number][] = [
  [-7.5, 3],
  [-6, -5],
  [6, -5],
  [7.5, 3],
];
const POST_TOP = 7.4;

export function TerminatelHall({ year, onExit }: { year: string; onExit?: () => void }) {
  const p = useOwned(() => {
    const marble = new CanvasTexture(createMarbleCanvas(1024, 82));
    marble.colorSpace = SRGBColorSpace;
    marble.wrapS = marble.wrapT = RepeatWrapping;
    // Wall UVs run one tile per metre : one marble picture every 4 m.
    marble.repeat.set(0.25, 0.3);
    const brass = new MeshStandardMaterial({ color: "#b08d57", roughness: 0.35, metalness: 0.85 });
    const walls = new MeshStandardMaterial({ map: marble, color: "#b5aca2", roughness: 0.4 });
    const plaque = plaqueTexture();
    return {
      marble,
      plaque,
      shell: {
        lower: walls,
        upper: walls,
        floor: new MeshStandardMaterial({ color: "#0c0b0a", roughness: 0.35 }),
        ceiling: new MeshStandardMaterial({ color: "#151210", roughness: 0.9 }),
        rails: brass,
      },
      brass,
      bulb: new MeshStandardMaterial({ color: "#ffd59a", emissive: "#ffb46b", emissiveIntensity: 2.2 }),
      velvet: new MeshStandardMaterial({ color: "#7a1f1c", roughness: 0.9 }),
      plaqueMaterial: new MeshStandardMaterial({ map: plaque, roughness: 0.35, metalness: 0.7 }),
      plaquePlane: new PlaneGeometry(7.2, 1.8),
      posts: mergeGeometries(
        POSTS.flatMap(([x, z]) => [post(x, z, 0, 0.3, 0.9, 1), post(x, z, 0.3, POST_TOP, 0.14), post(x, z, POST_TOP, POST_TOP + 0.5, 0.3, 0.2)]),
      ),
      ropes: mergeGeometries(
        POSTS.slice(1).map(([x, z], i) => rope([POSTS[i][0], POST_TOP - 0.2, POSTS[i][1]], [x, POST_TOP - 0.2, z], 1.1, 0.12)),
      ),
      sconceCup: boxes([{ size: [0.3, 0.9, 0.7], at: [0, 0, 0] }]),
      bulbBall: new SphereGeometry(0.35, 16, 12),
    };
  }, []);
  // The walls keep marble on both bands : no wood under the rail here.
  return (
    <RoomShell materials={p.shell} year={year} onExit={onExit}>
      <mesh geometry={p.plaquePlane} material={p.plaqueMaterial} position={[0, 11, -ROOM.depth / 2 + 0.05]} />
      <mesh geometry={p.posts} material={p.brass} castShadow />
      <mesh geometry={p.ropes} material={p.velvet} />
      {SCONCES.map(({ position, facing }, i) => (
        <group key={i} position={position}>
          <mesh geometry={p.sconceCup} material={p.brass} />
          <mesh geometry={p.bulbBall} material={p.bulb} position={[facing * 0.45, 0.4, 0]} />
          <pointLight position={[facing * 0.9, 0.2, 0]} color="#ffb46b" intensity={110} decay={2} distance={60} />
        </group>
      ))}
    </RoomShell>
  );
}
