import { useEffect, useMemo } from "react";
import {
  AdditiveBlending,
  Box3,
  CanvasTexture,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  Shape,
  Vector3,
} from "three";
import { useModels } from "../../scene/loaders";
import { assetUrl } from "../../assets";
import type { DoorState } from "../sequence";
import type { TemporalDoor as Door } from "../types";
import { COUNTER_HEIGHT, COUNTER_WIDTH, drawCounter, drawPlaque } from "./counter";
import { hideGlass } from "./glass";

// The temporal door (docs/MONDE_EXPLORABLE.md, §5) : the placeholder model
// prepared by tools/prepare_door.mjs (nodes cadre, battant, poignee ; 1 m = 8
// units, bottom of the frame at the origin, facing +z), the mantel clock on
// the lintel, the roller counter and the plate on the leaf, and the light of
// the era behind the opening. It only renders a DoorState : the timeline is
// src/world/sequence.ts.

/** Opening angle of the leaf, in radians (about 100°, away from the viewer). */
export const OPEN_ANGLE = 1.75;

function canvas(width: number, height: number) {
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  return element;
}

let glowMap: CanvasTexture | undefined;
/** Soft radial gradient for the light of the era : bright core, fading edges. */
function glowTexture(): CanvasTexture {
  if (glowMap) return glowMap;
  const element = canvas(128, 256);
  const ctx = element.getContext("2d")!;
  const gradient = ctx.createRadialGradient(64, 150, 6, 64, 140, 150);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.55)");
  gradient.addColorStop(1, "rgba(255,255,255,0.05)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 256);
  glowMap = new CanvasTexture(element);
  return glowMap;
}

/** Wall around the door, with an opening the size of the frame. */
function Wall({ frame, color = "#24302a" }: { frame: Box3; color?: string }) {
  const geometry = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-26, 0);
    shape.lineTo(26, 0);
    shape.lineTo(26, 22.4);
    shape.lineTo(-26, 22.4);
    shape.closePath();
    const hole = new Shape();
    hole.moveTo(frame.min.x + 0.05, 0);
    hole.lineTo(frame.max.x - 0.05, 0);
    hole.lineTo(frame.max.x - 0.05, frame.max.y - 0.05);
    hole.lineTo(frame.min.x + 0.05, frame.max.y - 0.05);
    hole.closePath();
    shape.holes.push(hole);
    return shape;
  }, [frame]);
  return (
    <mesh position={[0, 0, (frame.min.z + frame.max.z) / 2]} receiveShadow>
      <shapeGeometry args={[geometry]} />
      <meshStandardMaterial color={color} roughness={0.9} side={DoubleSide} />
    </mesh>
  );
}

export function TemporalDoor({
  door,
  state,
  wall = true,
}: {
  door: Door;
  state: DoorState;
  /** Its own wall around the frame (workshop) ; the corridor has its walls. */
  wall?: boolean;
}) {
  const [model, mantel] = useModels([assetUrl("models/monde/porte.glb"), assetUrl("models/monde/pendule.glb")]);
  const prepared = useMemo(() => {
    const scene = model.scene.clone(true);
    scene.traverse((object) => {
      if (object instanceof Mesh) object.castShadow = object.receiveShadow = true;
    });
    scene.updateMatrixWorld(true);
    const frame = new Box3().setFromObject(scene.getObjectByName("cadre") ?? scene);
    const leaf = scene.getObjectByName("battant") as Object3D;
    const handle = scene.getObjectByName("poignee") as Object3D;
    // Counter and plate, children of the leaf : they swing with it. The leaf
    // is in centimetres (scale of the prepared model) ; its front face is at
    // z ≈ 10.5 cm and it spans x from -100 cm (free edge) to 0 (hinges).
    const counterCanvas = canvas(COUNTER_WIDTH, COUNTER_HEIGHT);
    const counterTexture = new CanvasTexture(counterCanvas);
    counterTexture.colorSpace = SRGBColorSpace;
    const counter = new Mesh(
      new PlaneGeometry(40, 12.5),
      new MeshStandardMaterial({
        map: counterTexture,
        emissiveMap: counterTexture,
        emissive: "#ffffff",
        emissiveIntensity: 0.25,
        roughness: 0.45,
        metalness: 0.2,
      }),
    );
    counter.name = "compteur";
    counter.position.set(-50, 168, 10.9);
    const plaqueCanvas = canvas(512, 96);
    const plaqueTexture = new CanvasTexture(plaqueCanvas);
    plaqueTexture.colorSpace = SRGBColorSpace;
    const plaque = new Mesh(
      new PlaneGeometry(32, 6),
      new MeshStandardMaterial({
        map: plaqueTexture,
        emissiveMap: plaqueTexture,
        emissive: "#ffffff",
        emissiveIntensity: 0.3,
        roughness: 0.35,
        metalness: 0.4,
      }),
    );
    plaque.name = "plaque";
    plaque.position.set(-50, 155, 10.9);
    leaf.add(counter, plaque);
    const mantelScene = mantel.scene.clone(true);
    mantelScene.traverse((object) => {
      if (object instanceof Mesh) object.castShadow = true;
    });
    hideGlass(mantelScene);
    mantelScene.position.set((frame.min.x + frame.max.x) / 2, frame.max.y, (frame.min.z + frame.max.z) / 2);
    return {
      scene,
      frame,
      leaf,
      handle,
      base: { leaf: leaf.rotation.y, handle: handle.rotation.z },
      counter: { canvas: counterCanvas, texture: counterTexture, mesh: counter },
      plaque: { canvas: plaqueCanvas, texture: plaqueTexture, mesh: plaque },
      mantel: mantelScene,
    };
  }, [model.scene, mantel.scene]);
  useEffect(
    () => () => {
      for (const part of [prepared.counter, prepared.plaque]) {
        part.texture.dispose();
        part.mesh.geometry.dispose();
        (part.mesh.material as MeshStandardMaterial).dispose();
      }
    },
    [prepared],
  );
  // Plate : redrawn when the door (or the font) changes.
  useEffect(() => {
    const draw = () => {
      const ctx = prepared.plaque.canvas.getContext("2d");
      if (!ctx) return;
      drawPlaque(ctx, door.plaque);
      prepared.plaque.texture.needsUpdate = true;
    };
    draw();
    document.fonts?.ready.then(draw);
  }, [prepared, door.plaque]);
  // Moving parts and counter follow the state.
  useEffect(() => {
    prepared.leaf.rotation.y = prepared.base.leaf - OPEN_ANGLE * state.leaf;
    prepared.handle.rotation.z = prepared.base.handle - 0.9 * state.handle;
    const ctx = prepared.counter.canvas.getContext("2d");
    if (ctx) {
      drawCounter(ctx, state.counter);
      prepared.counter.texture.needsUpdate = true;
    }
  }, [prepared, state]);
  const glow = useMemo(() => new Color(door.glow), [door.glow]);
  const glowMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: glow,
        map: glowTexture(),
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [glow],
  );
  useEffect(() => () => glowMaterial.dispose(), [glowMaterial]);
  // The spot's target must be in the scene for its matrix to follow.
  const spotTarget = useMemo(() => new Object3D(), []);
  glowMaterial.opacity = 0.06 + 0.8 * state.glow;
  const { frame } = prepared;
  const centre = new Vector3();
  frame.getCenter(centre);
  return (
    <group>
      <primitive object={prepared.scene} />
      <primitive object={prepared.mantel} />
      {wall && <Wall frame={frame} />}
      {/* Light of the era, behind the opening : a glowing panel and a spot
          spilling through the door onto the floor. */}
      <mesh position={[centre.x, frame.max.y / 2, frame.min.z - 0.6]} material={glowMaterial}>
        <planeGeometry args={[frame.max.x - frame.min.x, frame.max.y]} />
      </mesh>
      <spotLight
        position={[centre.x, frame.max.y * 0.8, frame.min.z - 0.4]}
        color={glow}
        intensity={40 + 900 * state.glow}
        angle={0.55}
        penumbra={0.85}
        decay={2}
        distance={60}
        target={spotTarget}
      />
      <primitive object={spotTarget} position={[centre.x, 0, 14]} />
    </group>
  );
}
