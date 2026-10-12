import { CircleGeometry, CylinderGeometry, DoubleSide, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SphereGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { boxes, type BoxSpec } from "../kit";
import { ROOM, RoomShell } from "./RoomShell";
import { bush, curtain, post } from "./props";
import { moquetteTexture, roundRugTexture, skyTexture, sunsetPosterTexture, wallpaper1982Texture } from "./textures";
import { useOwned } from "./useOwned";

// A family living room of the early 1980s, the years the Minitel reached homes
// (the electronic directory), around the Minitel NFZ 300 (lot E,
// docs/DIRECTION_ARTISTIQUE.md) : banded wallpaper, brown shag carpet, an
// opal globe hanging from the ceiling, a walnut wall unit with the family
// television and books, a velvet sofa, the telephone on its pedestal table
// next to the terminal, a round rug, a sunset poster, net curtains, a rubber
// plant. Built in code : nothing to download.

const BACK = -ROOM.depth / 2;
const LEFT = -ROOM.width / 2;
const RIGHT = ROOM.width / 2;

/** Sofa facing +z : velvet seat, back and arms, low wooden plinth. */
function sofa() {
  const velvet: BoxSpec[] = [
    { size: [12, 1.7, 5.2], at: [0, 3.15, 0.2] },
    { size: [12, 4.6, 1.4], at: [0, 5.6, -2.2], tilt: -0.1 },
    { size: [1.3, 3.6, 5.8], at: [-6.6, 3.8, 0] },
    { size: [1.3, 3.6, 5.8], at: [6.6, 3.8, 0] },
    // Three seat cushions, a little proud of the seat.
    ...[-4, 0, 4].map((x): BoxSpec => ({ size: [3.85, 0.7, 4.6], at: [x, 4.3, 0.5] })),
  ];
  return {
    velvet: boxes(velvet),
    plinth: boxes([{ size: [14.4, 1.4, 6], at: [0, 1.3, 0] }, { size: [14, 0.6, 5.6], at: [0, 0.3, 0] }]),
  };
}

/** Telephone of the period on the table : body, sloped front, handset, dial. */
function telephone() {
  const body = boxes([
    { size: [1.8, 0.7, 2.2], at: [0, 0.35, 0] },
    { size: [1.7, 0.6, 1.3], at: [0, 0.85, 0.35], tilt: 0.35 },
  ]);
  const handset = boxes([
    { size: [0.45, 0.35, 2.5], at: [0, 1.35, -0.35] },
    { size: [0.7, 0.45, 0.7], at: [0, 1.25, -1.45] },
    { size: [0.7, 0.45, 0.7], at: [0, 1.25, 0.75] },
  ]);
  const dial = new CylinderGeometry(0.55, 0.55, 0.08, 24);
  dial.rotateX(Math.PI / 2 - 0.35);
  dial.translate(0, 0.98, 0.72);
  return { body, handset, dial };
}

export function Salon1982({ year, onExit }: { year: string; onExit?: () => void }) {
  const p = useOwned(() => {
    const textures = {
      paper: wallpaper1982Texture(),
      carpet: moquetteTexture(),
      rug: roundRugTexture(),
      poster: sunsetPosterTexture(),
      sky: skyTexture("ville"),
    };
    const paper = new MeshStandardMaterial({ map: textures.paper, roughness: 0.9 });
    const walnut = new MeshStandardMaterial({ color: "#5a3a22", roughness: 0.55 });
    const couch = sofa();
    const phone = telephone();
    // Walnut wall unit against the back wall : low cabinet, two uprights,
    // shelves, the family television on it.
    const unitZ = BACK + 1.7;
    const unit = boxes([
      { size: [18, 5.4, 3.4], at: [0, 2.7, unitZ] },
      { size: [0.5, 11.6, 2.6], at: [-8.75, 11.2, unitZ - 0.3] },
      { size: [0.5, 11.6, 2.6], at: [8.75, 11.2, unitZ - 0.3] },
      ...[9.2, 13, 16.8].map((y): BoxSpec => ({ size: [17.5, 0.35, 2.6], at: [0, y, unitZ - 0.3] })),
      { size: [18, 0.5, 3], at: [0, 17.2, unitZ - 0.3] },
    ]);
    const doors = boxes([-6, -2, 2, 6].map((x): BoxSpec => ({ size: [3.7, 4.4, 0.08], at: [x, 2.8, unitZ + 1.72] })));
    const knobs = mergeGeometries([-4.2, -0.2, 0.2, 4.2].map((x) => {
      const knob = new SphereGeometry(0.16, 10, 8);
      knob.translate(x, 3.2, unitZ + 1.85);
      return knob;
    }));
    const tvBox = boxes([{ size: [5.6, 4.4, 3.4], at: [-4.5, 7.6, unitZ] }]);
    const tvScreen = new PlaneGeometry(4.2, 3.2);
    tvScreen.translate(-4.9, 7.7, unitZ + 1.72);
    // Books on the two upper shelves, in the colours of the period.
    const bookColors = ["#7a2e22", "#c8a24a", "#2e4a5a", "#5a6b3a", "#9a5a2a"];
    const books = bookColors.map((_, c) =>
      boxes(
        Array.from({ length: 28 }, (_, i) => i)
          .filter((i) => i % bookColors.length === c)
          .map((i): BoxSpec => {
            const shelf = i < 14 ? 13 : 16.8;
            const x = -8 + (i % 14) * 1.15 + (i < 14 ? 0 : 0.4);
            const h = 2.4 + ((i * 37) % 9) / 10;
            return { size: [0.9, h, 1.9], at: [x, shelf + 0.18 + h / 2, unitZ - 0.4] };
          }),
      ),
    );
    // Pedestal table of the telephone, right of the terminal.
    const pedestal = mergeGeometries([post(0, 0, 0, 0.3, 1.4, 1.5), post(0, 0, 0.3, 4.4, 0.2), post(0, 0, 4.4, 4.7, 1.8)]);
    // Window with net curtains, right wall : local frame facing +z.
    const windowFrame = boxes([
      { size: [10, 0.4, 0.35], at: [0, 17.4, 0.18] },
      { size: [10.4, 0.35, 0.8], at: [0, 6.6, 0.4] },
      { size: [0.4, 11, 0.35], at: [-4.8, 12, 0.18] },
      { size: [0.4, 11, 0.35], at: [4.8, 12, 0.18] },
      { size: [0.25, 10.6, 0.25], at: [0, 12, 0.15] },
    ]);
    const net = curtain(9.6, 10.6, 9, 0.12);
    net.translate(0, 6.8, 0.55);
    const drapes = mergeGeometries(
      [-6.4, 6.4].map((x) => {
        const c = curtain(3, 15.6, 3, 0.3);
        c.translate(x, 3, 0.9);
        return c;
      }),
    );
    const globe = new SphereGeometry(1.5, 24, 16);
    globe.translate(0, ROOM.height - 2.8, 0);
    const cord = post(0, 0, ROOM.height - 1.4, ROOM.height, 0.05);
    const plant = {
      pot: post(0, 0, 0, 2.8, 1.2, 0.95),
      leaves: mergeGeometries([post(0, 0, 2.6, 8.5, 0.12), bush([0, 8.4, 0], 2.1, 16, 21), bush([0, 6.2, 0], 1.6, 10, 22)]),
    };
    return {
      ...textures,
      shell: {
        lower: paper,
        upper: paper,
        floor: new MeshStandardMaterial({ map: textures.carpet, roughness: 1 }),
        ceiling: new MeshStandardMaterial({ color: "#efe8da", roughness: 0.95 }),
        rails: walnut,
      },
      walnut,
      walnutDoor: new MeshStandardMaterial({ color: "#6a4428", roughness: 0.5 }),
      brass: new MeshStandardMaterial({ color: "#b08d57", roughness: 0.35, metalness: 0.85 }),
      velvet: new MeshStandardMaterial({ color: "#b4602a", roughness: 0.95 }),
      plastic: new MeshStandardMaterial({ color: "#c9bfae", roughness: 0.45 }),
      dialMaterial: new MeshStandardMaterial({ color: "#f1ece2", roughness: 0.3 }),
      tvMaterial: new MeshStandardMaterial({ color: "#2a2420", roughness: 0.5 }),
      tvGlass: new MeshStandardMaterial({ color: "#3a4a48", roughness: 0.15, metalness: 0.2 }),
      bookMaterials: bookColors.map((color) => new MeshStandardMaterial({ color, roughness: 0.8 })),
      rugMaterial: new MeshStandardMaterial({ map: textures.rug, roughness: 1 }),
      posterMaterial: new MeshStandardMaterial({ map: textures.poster, roughness: 0.7 }),
      frameMaterial: new MeshStandardMaterial({ color: "#c8c8c2", roughness: 0.3, metalness: 0.7 }),
      paint: new MeshStandardMaterial({ color: "#f0ebe0", roughness: 0.6 }),
      netMaterial: new MeshStandardMaterial({ color: "#f6f2ea", roughness: 1, transparent: true, opacity: 0.55, side: DoubleSide, depthWrite: false }),
      drapeMaterial: new MeshStandardMaterial({ color: "#7a4a22", roughness: 0.95, side: DoubleSide }),
      skyMaterial: new MeshBasicMaterial({ map: textures.sky }),
      opal: new MeshStandardMaterial({ color: "#fff6e6", emissive: "#ffd9a0", emissiveIntensity: 1.1, roughness: 0.4 }),
      terracotta: new MeshStandardMaterial({ color: "#a65a34", roughness: 0.8 }),
      green: new MeshStandardMaterial({ color: "#2f5a2c", roughness: 0.6 }),
      nested: [...Object.values(couch), ...Object.values(phone), ...Object.values(plant)],
      couch,
      phone,
      plant,
      books,
      unit,
      doors,
      knobs,
      tvBox,
      tvScreen,
      pedestal,
      windowFrame,
      net,
      drapes,
      globe,
      cord,
      pane: new PlaneGeometry(9.2, 10.6),
      rugDisc: new CircleGeometry(6.5, 48),
      posterPlane: new PlaneGeometry(4.8, 6.6),
      posterFrame: boxes([
        { size: [5.3, 0.25, 0.2], at: [0, 3.42, 0] },
        { size: [5.3, 0.25, 0.2], at: [0, -3.42, 0] },
        { size: [0.25, 7.1, 0.2], at: [-2.52, 0, 0] },
        { size: [0.25, 7.1, 0.2], at: [2.52, 0, 0] },
      ]),
    };
  }, []);
  return (
    <RoomShell materials={p.shell} year={year} chairRail={false} onExit={onExit}>
      {/* Opal globe on its cord. */}
      <mesh geometry={p.cord} material={p.walnut} />
      <mesh geometry={p.globe} material={p.opal} />
      {/* Wall unit, television, books. */}
      <mesh geometry={p.unit} material={p.walnut} receiveShadow />
      <mesh geometry={p.doors} material={p.walnutDoor} />
      <mesh geometry={p.knobs} material={p.brass} />
      <mesh geometry={p.tvBox} material={p.tvMaterial} />
      <mesh geometry={p.tvScreen} material={p.tvGlass} />
      {p.books.map((geometry, i) => (
        <mesh key={i} geometry={geometry} material={p.bookMaterials[i]} />
      ))}
      {/* Round rug in front of the terminal. */}
      <mesh geometry={p.rugDisc} material={p.rugMaterial} rotation-x={-Math.PI / 2} position={[0, 0.03, 3]} receiveShadow />
      {/* Sofa along the left wall, turned towards the room. */}
      <group position={[LEFT + 3.4, 0, 2]} rotation-y={Math.PI / 2}>
        <mesh geometry={p.couch.velvet} material={p.velvet} castShadow receiveShadow />
        <mesh geometry={p.couch.plinth} material={p.walnut} />
      </group>
      {/* Poster above the sofa. */}
      <group position={[LEFT + 0.12, 13, 2]} rotation-y={Math.PI / 2}>
        <mesh geometry={p.posterFrame} material={p.frameMaterial} />
        <mesh geometry={p.posterPlane} material={p.posterMaterial} position={[0, 0, 0.02]} />
      </group>
      {/* The telephone on its pedestal table, right of the terminal. */}
      <group position={[7.5, 0, 1]}>
        <mesh geometry={p.pedestal} material={p.walnut} castShadow />
        <group position={[0, 4.7, 0]} rotation-y={-0.5}>
          <mesh geometry={p.phone.body} material={p.plastic} castShadow />
          <mesh geometry={p.phone.handset} material={p.plastic} />
          <mesh geometry={p.phone.dial} material={p.dialMaterial} />
        </group>
      </group>
      {/* Window with net curtains, right wall. */}
      <group position={[RIGHT, 0, -6]} rotation-y={-Math.PI / 2}>
        <mesh geometry={p.pane} material={p.skyMaterial} position={[0, 12, 0.03]} />
        <mesh geometry={p.windowFrame} material={p.paint} />
        <mesh geometry={p.net} material={p.netMaterial} />
        <mesh geometry={p.drapes} material={p.drapeMaterial} />
      </group>
      {/* Rubber plant, back right corner. */}
      <group position={[RIGHT - 3.2, 0, BACK + 3.2]}>
        <mesh geometry={p.plant.pot} material={p.terracotta} />
        <mesh geometry={p.plant.leaves} material={p.green} />
      </group>
    </RoomShell>
  );
}
