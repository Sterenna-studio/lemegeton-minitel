import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Mesh, MeshStandardMaterial } from "three";
import { furniture, type Furniture } from "./furniture";

const url = (file: string) => `${import.meta.env.BASE_URL}models/mobilier/${file}`;

/** Piece de mobilier sous le terminal ; son plateau est a y = 0. */
export function Table({ piece }: { piece: Furniture & { file: string } }) {
  const { scene } = useGLTF(url(piece.file));
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
  return <primitive object={table} position={[0, -piece.top, piece.offsetZ]} />;
}

// The default piece is preloaded ; the others load when chosen.
useGLTF.preload(url(furniture[0].file!));
