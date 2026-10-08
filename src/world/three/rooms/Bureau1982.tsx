import { CircleGeometry, CylinderGeometry, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, TorusGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { boxes, type BoxSpec } from "../kit";
import { ROOM, RoomShell } from "./RoomShell";
import { leaves, post } from "./props";
import { calendarTexture, carpetTexture, ceilingTexture, clockFaceTexture, corkTexture, skyTexture } from "./textures";
import { useOwned } from "./useOwned";

// An office of 1982 around the Minitel (lot E, docs/DIRECTION_ARTISTIQUE.md) :
// greige walls with a darker washable lower band and an aluminium rail,
// grey-blue needle-felt carpet, a suspended ceiling with two fluorescent
// panels, venetian blinds on the town, a four-drawer filing cabinet, a swivel
// chair, a cork board, the October 1982 calendar, a wall clock, a yucca.
// Built in code : nothing to download.

const BACK = -ROOM.depth / 2;

/** Swivel chair facing +z, five-star base. */
function swivelChair() {
  const base: BoxSpec[] = Array.from({ length: 5 }, (_, i) => {
    const angle = (i / 5) * Math.PI * 2;
    return { size: [0.35, 0.3, 2.6], at: [Math.sin(angle) * 1.3, 0.45, Math.cos(angle) * 1.3], turn: angle };
  });
  return {
    metal: mergeGeometries([boxes(base), post(0, 0, 0.5, 3.2, 0.22), post(0, 0, 0.3, 0.6, 0.45)]),
    fabric: boxes([
      { size: [4, 0.9, 3.9], at: [0, 3.65, 0] },
      { size: [3.8, 4.4, 0.7], at: [0, 7, -1.95], tilt: -0.12 },
    ]),
    shell: boxes([
      { size: [0.25, 3.2, 0.25], at: [0, 5.2, -2.1] },
      { size: [4.1, 0.3, 4], at: [0, 3.1, 0] },
    ]),
  };
}

export function Bureau1982({ year, onExit }: { year: string; onExit?: () => void }) {
  const p = useOwned(() => {
    const textures = {
      carpet: carpetTexture(),
      ceilingTiles: ceilingTexture(),
      sky: skyTexture("ville"),
      calendar: calendarTexture(),
      cork: corkTexture(),
      clock: clockFaceTexture("bureau"),
    };
    const chair = swivelChair();
    // Filing cabinet in the back right corner : body, drawer fronts, handles.
    const cabinet = {
      body: boxes([{ size: [4.2, 10.6, 5.4], at: [12.6, 5.3, BACK + 3.2] }]),
      drawers: boxes([0, 1, 2, 3].map((i) => ({ size: [3.9, 2.35, 0.12], at: [12.6, 1.55 + i * 2.55, BACK + 5.95] }))),
      handles: boxes(
        [0, 1, 2, 3].flatMap((i) => [
          { size: [1.4, 0.22, 0.25], at: [12.6, 2.1 + i * 2.55, BACK + 6.1] },
          { size: [0.9, 0.45, 0.06], at: [12.6, 2.65 + i * 2.55, BACK + 6.03] },
        ]),
      ),
    };
    // Window with venetian blinds, back wall : local frame facing +z.
    const blinds = boxes(
      Array.from({ length: 22 }, (_, i) => ({ size: [13.6, 0.05, 0.5], at: [0, 7.9 + i * 0.45, 0.35], tilt: 0.5 })),
    );
    const windowFrame = boxes([
      { size: [14.6, 0.4, 0.3], at: [0, 18.2, 0.15] },
      { size: [14.6, 0.4, 0.6], at: [0, 7.4, 0.3] },
      { size: [0.4, 11.2, 0.3], at: [-7.1, 12.8, 0.15] },
      { size: [0.4, 11.2, 0.3], at: [7.1, 12.8, 0.15] },
      { size: [13.8, 0.6, 0.6], at: [0, 17.7, 0.4] },
    ]);
    const cords = mergeGeometries([post(-4.5, 0.6, 9.5, 17.4, 0.03), post(4.5, 0.6, 9.5, 17.4, 0.03)]);
    // Fluorescent panels in the suspended ceiling.
    const tubes = boxes([-5.5, 5.5].map((x) => ({ size: [2.6, 0.12, 9.6], at: [x, ROOM.height - 0.07, -2] })));
    const tubeFrames = boxes(
      [-5.5, 5.5].flatMap((x) => [
        { size: [3, 0.2, 0.2], at: [x, ROOM.height - 0.1, 2.9] },
        { size: [3, 0.2, 0.2], at: [x, ROOM.height - 0.1, -6.9] },
        { size: [0.2, 0.2, 10], at: [x - 1.4, ROOM.height - 0.1, -2] },
        { size: [0.2, 0.2, 10], at: [x + 1.4, ROOM.height - 0.1, -2] },
      ]),
    );
    const yucca = {
      pot: post(0, 0, 0, 3.4, 1.35, 1.05),
      soil: post(0, 0, 3.2, 3.35, 1.25),
      trunks: mergeGeometries([post(0.3, 0, 3.3, 9.5, 0.22, 0.28), post(-0.4, 0.3, 3.3, 11.8, 0.2, 0.26), post(0.1, -0.4, 3.3, 7.6, 0.18, 0.24)]),
      leaves: leaves(
        [
          [0.3, 9.5, 0],
          [-0.4, 11.8, 0.3],
          [0.1, 7.6, -0.4],
        ],
        13,
        2.8,
        0.22,
        82,
      ),
    };
    const clockRim = new TorusGeometry(1.75, 0.16, 10, 40);
    return {
      ...textures,
      shell: {
        lower: new MeshStandardMaterial({ color: "#aaa391", roughness: 0.7 }),
        upper: new MeshStandardMaterial({ color: "#ddd5c2", roughness: 0.9 }),
        floor: new MeshStandardMaterial({ map: textures.carpet, roughness: 1 }),
        ceiling: new MeshStandardMaterial({ map: textures.ceilingTiles, roughness: 0.95 }),
        rails: new MeshStandardMaterial({ color: "#a9a9a3", roughness: 0.35, metalness: 0.6 }),
      },
      steel: new MeshStandardMaterial({ color: "#7d8476", roughness: 0.45, metalness: 0.35 }),
      steelLight: new MeshStandardMaterial({ color: "#8f9688", roughness: 0.4, metalness: 0.35 }),
      chrome: new MeshStandardMaterial({ color: "#c8c9c6", roughness: 0.25, metalness: 0.9 }),
      blackPlastic: new MeshStandardMaterial({ color: "#26241f", roughness: 0.6 }),
      fabric: new MeshStandardMaterial({ color: "#9a5428", roughness: 0.95 }),
      slat: new MeshStandardMaterial({ color: "#ddd3b8", roughness: 0.5 }),
      aluminium: new MeshStandardMaterial({ color: "#b5b5ae", roughness: 0.35, metalness: 0.7 }),
      skyMaterial: new MeshBasicMaterial({ map: textures.sky }),
      tubeMaterial: new MeshStandardMaterial({ color: "#f7f8f2", emissive: "#f4f6ee", emissiveIntensity: 1.6 }),
      paper: new MeshStandardMaterial({ map: textures.calendar, roughness: 0.85 }),
      corkMaterial: new MeshStandardMaterial({ map: textures.cork, roughness: 1 }),
      pine: new MeshStandardMaterial({ color: "#b98c55", roughness: 0.6 }),
      faceMaterial: new MeshStandardMaterial({ map: textures.clock, roughness: 0.4 }),
      terracotta: new MeshStandardMaterial({ color: "#efe9dc", roughness: 0.4 }),
      soilMaterial: new MeshStandardMaterial({ color: "#3a2a1c", roughness: 1 }),
      bark: new MeshStandardMaterial({ color: "#7a6448", roughness: 0.9 }),
      green: new MeshStandardMaterial({ color: "#4e7a3c", roughness: 0.7 }),
      nested: [...Object.values(chair), ...Object.values(cabinet), ...Object.values(yucca)],
      chair,
      cabinet,
      yucca,
      blinds,
      windowFrame,
      cords,
      tubes,
      tubeFrames,
      clockRim,
      pane: new PlaneGeometry(13.8, 10.8),
      calendarPlane: new PlaneGeometry(3.6, 5.4),
      corkPlane: new PlaneGeometry(9, 5.6),
      corkFrame: boxes([
        { size: [9.6, 0.3, 0.3], at: [0, 2.95, 0] },
        { size: [9.6, 0.3, 0.3], at: [0, -2.95, 0] },
        { size: [0.3, 6.2, 0.3], at: [-4.65, 0, 0] },
        { size: [0.3, 6.2, 0.3], at: [4.65, 0, 0] },
      ]),
      face: new CircleGeometry(1.7, 40),
      clockBack: (() => {
        const back = new CylinderGeometry(1.75, 1.75, 0.3, 40);
        back.rotateX(Math.PI / 2);
        return back;
      })(),
    };
  }, []);
  return (
    <RoomShell materials={p.shell} year={year} onExit={onExit}>
      {/* Suspended ceiling lights. */}
      <mesh geometry={p.tubes} material={p.tubeMaterial} />
      <mesh geometry={p.tubeFrames} material={p.aluminium} />
      {/* Window with blinds, back wall, on the left of the terminal. */}
      <group position={[-5, 0, BACK]}>
        <mesh geometry={p.pane} material={p.skyMaterial} position={[0, 12.8, 0.03]} />
        <mesh geometry={p.windowFrame} material={p.aluminium} />
        <mesh geometry={p.blinds} material={p.slat} />
        <mesh geometry={p.cords} material={p.slat} />
      </group>
      {/* Calendar, back wall, right of the window. */}
      <mesh geometry={p.calendarPlane} material={p.paper} position={[6.5, 13, BACK + 0.04]} />
      {/* Filing cabinet. */}
      <mesh geometry={p.cabinet.body} material={p.steel} receiveShadow />
      <mesh geometry={p.cabinet.drawers} material={p.steelLight} />
      <mesh geometry={p.cabinet.handles} material={p.chrome} />
      {/* Swivel chair, pulled out beside the terminal. */}
      <group position={[6.5, 0, 1.5]} rotation-y={Math.atan2(-6.5, -1.5)}>
        <mesh geometry={p.chair.metal} material={p.blackPlastic} castShadow />
        <mesh geometry={p.chair.fabric} material={p.fabric} castShadow receiveShadow />
        <mesh geometry={p.chair.shell} material={p.blackPlastic} />
      </group>
      {/* Cork board, left wall. */}
      <group position={[-ROOM.width / 2 + 0.2, 12.5, -6]} rotation-y={Math.PI / 2}>
        <mesh geometry={p.corkFrame} material={p.pine} />
        <mesh geometry={p.corkPlane} material={p.corkMaterial} position={[0, 0, 0.02]} />
      </group>
      {/* Wall clock, right wall. */}
      <group position={[ROOM.width / 2 - 0.2, 16.5, -4]} rotation-y={-Math.PI / 2}>
        <mesh geometry={p.clockBack} material={p.blackPlastic} />
        <mesh geometry={p.clockRim} material={p.blackPlastic} position={[0, 0, 0.15]} />
        <mesh geometry={p.face} material={p.faceMaterial} position={[0, 0, 0.17]} />
      </group>
      {/* Yucca, back left corner. */}
      <group position={[-12.8, 0, BACK + 3.4]}>
        <mesh geometry={p.yucca.pot} material={p.terracotta} />
        <mesh geometry={p.yucca.soil} material={p.soilMaterial} />
        <mesh geometry={p.yucca.trunks} material={p.bark} />
        <mesh geometry={p.yucca.leaves} material={p.green} />
      </group>
    </RoomShell>
  );
}
