import { useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { Mesh, MeshStandardMaterial, type Object3D } from "three";
import { useModel } from "../../scene/loaders";
import { assetUrl } from "../../assets";
import { hideGlass } from "./glass";

// Grandfather clock of the corridor (Poly Haven, CC0) : its hands are separate
// nodes. They show the local time and race during the door sequence
// (clockSpeed, src/world/sequence.ts). The dial already faces +z in the file
// (the body node carries the turn).

const TURN = Math.PI * 2;

export function GrandfatherClock({ speed, ...props }: { speed: number } & ThreeElements["group"]) {
  const model = useModel(assetUrl("models/monde/horloge.glb"));
  const prepared = useMemo(() => {
    const scene = model.scene.clone(true);
    // The file marks the enamel dial as metal : under the corridor's dim
    // environment it reads black. Damp the metalness (wood is unaffected).
    const materials = new Map<MeshStandardMaterial, MeshStandardMaterial>();
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = object.receiveShadow = true;
      if (object.material instanceof MeshStandardMaterial) {
        const source = object.material;
        if (!materials.has(source)) {
          const copy = source.clone();
          copy.metalness = 0.2;
          materials.set(source, copy);
        }
        object.material = materials.get(source)!;
      }
    });
    hideGlass(scene);
    const minute = scene.getObjectByName("vintage_grandfather_clock_01_minute_hand") as Object3D;
    const hour = scene.getObjectByName("vintage_grandfather_clock_01_houd_hand") as Object3D;
    return { scene, minute, hour, base: { minute: minute.rotation.z, hour: hour.rotation.z } };
  }, [model.scene]);
  // Simulated time, in seconds since midnight : starts at the local time.
  const time = useRef(
    (() => {
      const now = new Date();
      return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    })(),
  );
  useFrame((_, delta) => {
    time.current += Math.min(delta, 0.1) * speed;
    // Clockwise seen from the front : negative turn around the hand's axis.
    prepared.minute.rotation.z = prepared.base.minute - (time.current / 3600) * TURN;
    prepared.hour.rotation.z = prepared.base.hour - (time.current / 43200) * TURN;
  });
  return (
    <group {...props}>
      <primitive object={prepared.scene} />
    </group>
  );
}
