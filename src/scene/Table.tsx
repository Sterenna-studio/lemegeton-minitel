import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Mesh, MeshStandardMaterial } from "three";

const url = `${import.meta.env.BASE_URL}models/table.glb`;
// tools/prepare_table.py : 1 m = 8 units, top at 5.9513. The terminal stays at
// the origin, so the table is lowered under it and pushed back a little to
// carry the keyboard as well as the case.
export const TABLE_TOP = 5.9513;
const OFFSET_Z = 0.75;

export function Table() {
  const { scene } = useGLTF(url);
  const table = useMemo(() => scene.clone(true), [scene]);
  useEffect(() => {
    const materials: MeshStandardMaterial[] = [];
    table.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = object.receiveShadow = true;
      if (object.material instanceof MeshStandardMaterial) {
        object.material = object.material.clone();
        // Waxed wood rather than varnish : soft, warm reflections only.
        object.material.envMapIntensity = 0.35;
        materials.push(object.material);
      }
    });
    return () => materials.forEach((material) => material.dispose());
  }, [table]);
  return <primitive object={table} position={[0, -TABLE_TOP, OFFSET_Z]} />;
}

useGLTF.preload(url);
