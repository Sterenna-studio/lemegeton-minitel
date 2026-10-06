import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export const DEFAULT_MODEL_URL = '/models/minitel.glb';
export const DEFAULT_SCREEN_MESH = 'Minitel_Screen';

export interface MinitelModelInfo {
  /** Mesh receiving the screen texture: the one named in the GLB, or a generated fallback plane. */
  screen: THREE.Mesh;
  /** True when the screen mesh was not found in the GLB and a plane was generated. */
  fallback: boolean;
  bounds: THREE.Box3;
}

export interface MinitelModelProps {
  /** Texture shown on the CRT, using the glTF UV convention (flipY = false). */
  screen: THREE.Texture;
  url?: string;
  screenMeshName?: string;
  onReady?: (info: MinitelModelInfo) => void;
}

// Without a named screen mesh, place a 4:3 plane on the front face of the bounding box.
function fallbackScreen(bounds: THREE.Box3): THREE.Mesh {
  const size = bounds.getSize(new THREE.Vector3());
  const width = size.x * 0.55;
  const geometry = new THREE.PlaneGeometry(width, width * 0.75);
  // Match the glTF UV convention (v=0 at the top) expected by screen textures.
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
  const plane = new THREE.Mesh(geometry);
  plane.name = 'Minitel_Screen_Fallback';
  plane.position.set((bounds.min.x + bounds.max.x) / 2, bounds.min.y + size.y * 0.6, bounds.max.z + 0.005);
  return plane;
}

export function MinitelModel({ screen, url = DEFAULT_MODEL_URL, screenMeshName = DEFAULT_SCREEN_MESH, onReady }: MinitelModelProps) {
  const { scene } = useGLTF(url);
  // Clone so several Minitels can share one cached GLB with their own screen.
  const model = useMemo(() => scene.clone(true), [scene]);
  const target = useMemo(() => {
    const found = model.getObjectByName(screenMeshName);
    if (found instanceof THREE.Mesh) return { mesh: found, fallback: false };
    const plane = fallbackScreen(new THREE.Box3().setFromObject(model));
    model.add(plane);
    return { mesh: plane, fallback: true };
  }, [model, screenMeshName]);

  useEffect(() => {
    const material = new THREE.MeshBasicMaterial({ map: screen, toneMapped: false });
    const previous = target.mesh.material;
    target.mesh.material = material;
    return () => { target.mesh.material = previous; material.dispose(); };
  }, [target, screen]);

  useEffect(() => {
    onReady?.({ screen: target.mesh, fallback: target.fallback, bounds: new THREE.Box3().setFromObject(model) });
  }, [model, target, onReady]);

  return <primitive object={model} />;
}

useGLTF.preload(DEFAULT_MODEL_URL);
