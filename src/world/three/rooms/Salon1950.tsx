import { CircleGeometry, CylinderGeometry, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, DoubleSide } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useKtx2Textures } from "../../../scene/loaders";
import { STAND_TOP } from "../../terminalView";
import { TILE, boxes, material, textureSet, tiled, type BoxSpec } from "../kit";
import { ROOM, RoomShell } from "./RoomShell";
import { bush, curtain, leaves, post, taperedLegs, vase } from "./props";
import { clockFaceTexture, paintingTexture, rugTexture, skyTexture } from "./textures";
import { useOwned } from "./useOwned";

// A living room of the 1950s around the television (lot E,
// docs/DIRECTION_ARTISTIQUE.md) : light oak wainscot, warm wallpaper,
// herringbone parquet, a teak TV cabinet on splayed legs, two cocktail
// armchairs turned towards the screen, an atomic rug, a sideboard under an
// abstract painting, a sunburst clock, a floor lamp, a window on the garden.
// Built in code on the corridor's textures : nothing more to download.

/** Armchair facing +z, seat 42 cm high : fabric and wood geometries. */
function armchair() {
  const fabric: BoxSpec[] = [
    { size: [5, 1.2, 4.6], at: [0, 3.6, 0.2] },
    { size: [5, 5.2, 1], at: [0, 6.7, -2.1], tilt: -0.22 },
  ];
  const wood: BoxSpec[] = [
    { size: [5.3, 0.4, 4.8], at: [0, 2.85, 0.2] },
    { size: [0.45, 0.3, 4.4], at: [-2.75, 5.3, 0.3] },
    { size: [0.45, 0.3, 4.4], at: [2.75, 5.3, 0.3] },
    { size: [0.35, 2.3, 0.35], at: [-2.75, 4.1, 2.2] },
    { size: [0.35, 2.3, 0.35], at: [2.75, 4.1, 2.2] },
  ];
  return {
    fabric: boxes(fabric),
    wood: mergeGeometries([
      boxes(wood),
      taperedLegs(
        [
          [-2.2, 2.1],
          [2.2, 2.1],
          [-2.2, -1.7],
          [2.2, -1.7],
        ],
        2.65,
      ),
    ]),
  };
}

const SIDEBOARD_Z = -ROOM.depth / 2 + 1.9;

export function Salon1950({ year, stand, onExit }: { year: string; stand: boolean; onExit?: () => void }) {
  const maps = useKtx2Textures(["dark_paneled_wood", "decrepit_wallpaper", "herringbone_parquet"].flatMap(textureSet));
  const parts = useOwned(() => {
    const parquet = tiled(maps.slice(6, 9), (ROOM.width / TILE) * 2, (ROOM.depth / TILE) * 2);
    const textures = { rug: rugTexture(), painting: paintingTexture(), sky: skyTexture("jardin"), clock: clockFaceTexture("soleil") };
    const teak = new MeshStandardMaterial({ color: "#8a5a32", roughness: 0.55 });
    const brass = new MeshStandardMaterial({ color: "#b08d57", roughness: 0.35, metalness: 0.85 });
    const chair = armchair();
    const sideboard = {
      body: mergeGeometries([
        boxes([
          { size: [14, 4.2, 3.2], at: [0, 3.8, SIDEBOARD_Z] },
          { size: [14.4, 0.25, 3.4], at: [0, 6.03, SIDEBOARD_Z] },
        ]),
        taperedLegs(
          [
            [-6.6, SIDEBOARD_Z + 1.2],
            [6.6, SIDEBOARD_Z + 1.2],
            [-6.6, SIDEBOARD_Z - 1.2],
            [6.6, SIDEBOARD_Z - 1.2],
          ].map(([x, z]) => [x, z] as [number, number]),
          1.7,
        ),
      ]),
      seams: boxes([-3.5, 0, 3.5].map((x) => ({ size: [0.06, 3.8, 0.04], at: [x, 3.8, SIDEBOARD_Z + 1.61] }))),
      pulls: boxes([-5.25, -1.75, 1.75, 5.25].map((x) => ({ size: [0.14, 0.7, 0.14], at: [x + (x < 0 ? 1 : -1) * 1.3, 4.1, SIDEBOARD_Z + 1.66] }))),
    };
    const cabinet = stand
      ? {
          body: mergeGeometries([
            boxes([
              { size: [5, 2.65, 3], at: [0, 3.225, 0] },
              { size: [5.4, 0.25, 3.3], at: [0, STAND_TOP - 0.125, 0] },
            ]),
            taperedLegs(
              [
                [-2.1, 1.1],
                [2.1, 1.1],
                [-2.1, -1.1],
                [2.1, -1.1],
              ],
              1.9,
              0.17,
              0.09,
            ),
          ]),
          seam: boxes([{ size: [0.05, 2.3, 0.04], at: [0, 3.225, 1.51] }]),
          pulls: boxes([-0.45, 0.45].map((x) => ({ size: [0.12, 0.55, 0.12], at: [x, 3.4, 1.56] }))),
        }
      : undefined;
    // Window : local frame, wall plane = xy, facing +z.
    const windowFrame = boxes([
      { size: [9.8, 0.5, 0.4], at: [0, 17.25, 0.2] },
      { size: [10.4, 0.35, 0.9], at: [0, 5.8, 0.45] },
      { size: [0.5, 11.5, 0.4], at: [-4.65, 11.5, 0.2] },
      { size: [0.5, 11.5, 0.4], at: [4.65, 11.5, 0.2] },
      { size: [0.22, 11, 0.22], at: [0, 11.5, 0.15] },
      { size: [9, 0.22, 0.22], at: [0, 14.2, 0.15] },
    ]);
    const curtains = mergeGeometries(
      [-6.3, 6.3].map((x) => {
        const c = curtain(3.6, 15.4, 3);
        c.translate(x, 3.2, 0.9);
        return c;
      }),
    );
    const rod = mergeGeometries([
      boxes([{ size: [16.4, 0.2, 0.2], at: [0, 18.8, 0.95] }]),
      post(-8.3, 0.95, 18.55, 19.05, 0.3),
      post(8.3, 0.95, 18.55, 19.05, 0.3),
    ]);
    // Sunburst clock : local frame facing +z.
    const rays = boxes(
      Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const length = i % 2 ? 1.5 : 2.6;
        const r = 1.35 + length / 2;
        return { size: [0.12, length, 0.06], at: [Math.cos(angle) * r, Math.sin(angle) * r, 0.12], roll: angle - Math.PI / 2 };
      }),
    );
    const clockRim = new CylinderGeometry(1.3, 1.3, 0.3, 32);
    clockRim.rotateX(Math.PI / 2);
    // Floor lamp in the back left corner ; its light is salonLighting's lamp.
    const lampMetal = mergeGeometries([post(0, 0, 0, 0.3, 1.2, 1.35), post(0, 0, 0.3, 11.4, 0.1)]);
    const shade = new CylinderGeometry(1.1, 1.9, 2.6, 24, 1, true);
    shade.translate(0, 12.5, 0);
    const fern = {
      stand: mergeGeometries([post(0, 0, 0, 3.6, 0.22), post(0, 0, 3.6, 3.8, 1.1)]),
      pot: post(0, 0, 3.8, 6.2, 1.0, 0.75),
      leaves: mergeGeometries([leaves([[0, 6.1, 0]], 14, 3.4, 0.4, 5), bush([0, 6.6, 0], 1.1, 8, 6)]),
    };
    return {
      ...textures,
      parquet,
      shell: {
        lower: material(maps.slice(0, 3), "#e6cfae"),
        upper: material(maps.slice(3, 6), "#e8c39a"),
        floor: material(parquet, "#a47a52"),
        ceiling: new MeshStandardMaterial({ color: "#efe6d2", roughness: 0.95 }),
        rails: new MeshStandardMaterial({ color: "#5a3b24", roughness: 0.5 }),
      },
      teak,
      teakDark: new MeshStandardMaterial({ color: "#3b2516", roughness: 0.6 }),
      brass,
      mustard: new MeshStandardMaterial({ color: "#b8862f", roughness: 0.92 }),
      teal: new MeshStandardMaterial({ color: "#2f6b66", roughness: 0.92 }),
      rugMaterial: new MeshStandardMaterial({ map: textures.rug, roughness: 1 }),
      paintingMaterial: new MeshStandardMaterial({ map: textures.painting, roughness: 0.8 }),
      gilt: new MeshStandardMaterial({ color: "#9a7a3e", roughness: 0.4, metalness: 0.6 }),
      paint: new MeshStandardMaterial({ color: "#ebe4d2", roughness: 0.6 }),
      skyMaterial: new MeshBasicMaterial({ map: textures.sky }),
      velvet: new MeshStandardMaterial({ color: "#8a2f2a", roughness: 0.95, side: DoubleSide }),
      celadon: new MeshStandardMaterial({ color: "#7fa89a", roughness: 0.3 }),
      books: new MeshStandardMaterial({ color: "#6e2a23", roughness: 0.8 }),
      faceMaterial: new MeshStandardMaterial({ map: textures.clock, roughness: 0.5 }),
      shadeMaterial: new MeshStandardMaterial({ color: "#efe2c4", emissive: "#ffcf8a", emissiveIntensity: 0.6, roughness: 0.9, side: DoubleSide }),
      green: new MeshStandardMaterial({ color: "#4f7a3f", roughness: 0.8 }),
      ceramic: new MeshStandardMaterial({ color: "#d9cdb4", roughness: 0.35 }),
      // Nested geometries, for disposal.
      nested: [...Object.values(chair), ...Object.values(sideboard), ...Object.values(cabinet ?? {}), ...Object.values(fern)],
      chair,
      sideboard,
      cabinet,
      windowFrame,
      curtains,
      rod,
      rays,
      clockRim,
      lampMetal,
      shade,
      fern,
      vase: vase(3.2, 0.9),
      rugPlane: new PlaneGeometry(15, 10),
      canvasPlane: new PlaneGeometry(8.5, 5.9),
      pane: new PlaneGeometry(9, 11),
      face: new CircleGeometry(1.15, 32),
      frame: boxes([
        { size: [9.4, 0.45, 0.3], at: [0, 3.18, 0] },
        { size: [9.4, 0.45, 0.3], at: [0, -3.18, 0] },
        { size: [0.45, 6.8, 0.3], at: [-4.48, 0, 0] },
        { size: [0.45, 6.8, 0.3], at: [4.48, 0, 0] },
      ]),
      bookStack: boxes([
        { size: [0.45, 2.4, 1.8], at: [4.2, 7.35, SIDEBOARD_Z] },
        { size: [0.5, 2.2, 1.7], at: [4.7, 7.25, SIDEBOARD_Z] },
        { size: [0.45, 2.3, 1.8], at: [5.3, 7.25, SIDEBOARD_Z], roll: -0.3 },
      ]),
    };
  }, [maps, stand]);
  const p = parts;
  const chairs: [number, number, number][] = [
    [-9.5, 2, Math.atan2(9.5, -2)],
    [9.5, 2, Math.atan2(-9.5, -2)],
  ];
  return (
    <RoomShell materials={p.shell} year={year} onExit={onExit}>
      {p.cabinet && (
        <group>
          <mesh geometry={p.cabinet.body} material={p.teak} castShadow receiveShadow />
          <mesh geometry={p.cabinet.seam} material={p.teakDark} />
          <mesh geometry={p.cabinet.pulls} material={p.brass} />
        </group>
      )}
      <mesh geometry={p.rugPlane} material={p.rugMaterial} rotation-x={-Math.PI / 2} position={[0, 0.03, 2.5]} receiveShadow />
      {chairs.map(([x, z, turn], i) => (
        <group key={i} position={[x, 0, z]} rotation-y={turn}>
          <mesh geometry={p.chair.fabric} material={i ? p.teal : p.mustard} castShadow receiveShadow />
          <mesh geometry={p.chair.wood} material={p.teak} castShadow />
        </group>
      ))}
      {/* Sideboard, vase and books, the painting above. */}
      <mesh geometry={p.sideboard.body} material={p.teak} receiveShadow />
      <mesh geometry={p.sideboard.seams} material={p.teakDark} />
      <mesh geometry={p.sideboard.pulls} material={p.brass} />
      <mesh geometry={p.vase} material={p.celadon} position={[-4.5, 6.15, SIDEBOARD_Z]} />
      <mesh geometry={p.bookStack} material={p.books} />
      <group position={[0, 13.4, -ROOM.depth / 2 + 0.2]}>
        <mesh geometry={p.frame} material={p.gilt} />
        <mesh geometry={p.canvasPlane} material={p.paintingMaterial} position={[0, 0, 0.02]} />
      </group>
      {/* Window on the garden, left wall. */}
      <group position={[-ROOM.width / 2, 0, -4]} rotation-y={Math.PI / 2}>
        <mesh geometry={p.pane} material={p.skyMaterial} position={[0, 11.5, 0.03]} />
        <mesh geometry={p.windowFrame} material={p.paint} />
        <mesh geometry={p.curtains} material={p.velvet} />
        <mesh geometry={p.rod} material={p.brass} />
      </group>
      {/* Sunburst clock, right wall. */}
      <group position={[ROOM.width / 2 - 0.05, 15, -5]} rotation-y={-Math.PI / 2}>
        <mesh geometry={p.rays} material={p.brass} />
        <mesh geometry={p.clockRim} material={p.brass} position={[0, 0, 0.15]} />
        <mesh geometry={p.face} material={p.faceMaterial} position={[0, 0, 0.31]} />
      </group>
      {/* Floor lamp, back left corner. */}
      <group position={[-12.5, 0, -15]}>
        <mesh geometry={p.lampMetal} material={p.brass} />
        <mesh geometry={p.shade} material={p.shadeMaterial} />
      </group>
      {/* Fern on its stand, back right corner. */}
      <group position={[12.6, 0, -16.2]}>
        <mesh geometry={p.fern.stand} material={p.teak} />
        <mesh geometry={p.fern.pot} material={p.ceramic} />
        <mesh geometry={p.fern.leaves} material={p.green} />
      </group>
    </RoomShell>
  );
}
