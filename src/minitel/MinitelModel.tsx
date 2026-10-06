import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import {
  Box3,
  BoxHelper,
  CanvasTexture,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
  type Material,
} from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { ModelInfo, ModelProfile, ScreenSource } from "./types";
import type { CrtEffects } from "../videotex/renderer";
import { MinitelScreen } from "./MinitelScreen";
/** Role of a mesh, as seen by a finish. */
export type MeshRole = "body" | "key";
/**
 * Optional material pass applied to every mesh except the screen, after cloning.
 * Lets an experience restyle a model (colour, finish) without editing the GLB.
 * Keep the function stable (module level) : it is part of the memo key.
 */
export type MaterialFinish = (mesh: Mesh, material: Material, role: MeshRole) => void;
export interface DebugSettings {
  axes: boolean;
  wireframe: boolean;
  bounds: boolean;
  names: boolean;
}
interface Props {
  model: string;
  profile: ModelProfile;
  finish?: MaterialFinish;
  screenSource: ScreenSource;
  effects: CrtEffects;
  reducedMotion: boolean;
  onKey?: (key: string) => void;
  onInfo?: (info: ModelInfo) => void;
  debug?: DebugSettings;
  selectedName?: string;
}
export function MinitelModel({
  model,
  profile,
  finish,
  screenSource,
  effects,
  reducedMotion,
  onKey,
  onInfo,
  debug,
  selectedName,
}: Props) {
  const gltf = useGLTF(model);
  const prepared = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const materials: Material[] = [];
    const meshes: Mesh[] = [];
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.material = Array.isArray(object.material)
        ? object.material.map((m) => m.clone())
        : object.material.clone();
      const list = Array.isArray(object.material)
        ? object.material
        : [object.material];
      list.forEach((m) => {
        materials.push(m);
        if (m instanceof MeshStandardMaterial) {
          m.roughness = 0.8;
          m.metalness = 0;
        }
      });
      object.castShadow = true;
      object.receiveShadow = true;
      meshes.push(object);
    });
    if (profile.normalize) {
      const box = new Box3().setFromObject(scene);
      const size = box.getSize(new Vector3());
      const center = box.getCenter(new Vector3());
      const scale = 2.4 / Math.max(size.y, 0.001);
      scene.scale.multiplyScalar(scale);
      scene.position.set(
        -center.x * scale,
        -box.min.y * scale,
        -center.z * scale,
      );
      scene.updateMatrixWorld(true);
    }
    const screen = meshes.find(
      (m) =>
        profile.screenNames.some(
          (name) => m.name.toLowerCase() === name.toLowerCase(),
        ) || m.userData.role === "screen",
    );
    if (finish)
      meshes.forEach((mesh) => {
        if (mesh === screen) return;
        const role: MeshRole =
          profile.keys[mesh.name] !== undefined ||
          typeof mesh.userData.key === "string" ||
          mesh.name.startsWith("Key_")
            ? "key"
            : "body";
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(
          (material) => finish(mesh, material, role),
        );
      });
    let fallback: Mesh | undefined;
    if (!screen) {
      fallback = new Mesh(
        new PlaneGeometry(...profile.screenFallback.size),
        new MeshStandardMaterial(),
      );
      fallback.name = "Screen_Overlay";
      fallback.position.set(...profile.screenFallback.position);
      if (profile.screenFallback.rotation)
        fallback.rotation.set(...profile.screenFallback.rotation);
      materials.push(fallback.material as Material);
    }
    const textures = new Set<string>();
    let triangles = 0;
    meshes.forEach((mesh) => {
      triangles +=
        (mesh.geometry.index?.count ??
          mesh.geometry.attributes.position.count) / 3;
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(
        (material) => {
          if (material instanceof MeshStandardMaterial && material.map)
            textures.add(material.map.uuid);
        },
      );
    });
    return {
      scene,
      meshes,
      materials,
      screen: screen ?? fallback!,
      fallback,
      info: {
        meshes: meshes.map((m) => ({
          name: m.name,
          vertices: m.geometry.attributes.position.count,
        })),
        triangles,
        textures: textures.size,
      },
    };
  }, [gltf.scene, profile, finish]);
  useEffect(() => {
    onInfo?.(prepared.info);
  }, [prepared, onInfo]);
  useEffect(
    () => () => {
      prepared.materials.forEach((m) => m.dispose());
      prepared.fallback?.geometry.dispose();
    },
    [prepared],
  );
  useEffect(() => {
    prepared.materials.forEach((m) => {
      if (m instanceof MeshStandardMaterial) m.wireframe = !!debug?.wireframe;
    });
  }, [prepared, debug?.wireframe]);
  const helper = useMemo(
    () =>
      new BoxHelper(
        prepared.meshes.find((mesh) => mesh.name === selectedName) ??
          prepared.scene,
        "#a4513e",
      ),
    [prepared, selectedName],
  );
  useEffect(
    () => () => {
      helper.geometry.dispose();
      (helper.material as Material).dispose();
    },
    [helper],
  );
  const labels = useMemo(
    () =>
      debug?.names
        ? prepared.meshes.map((mesh) => {
            const canvas = document.createElement("canvas");
            canvas.width = 256;
            canvas.height = 48;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "#202d27";
              ctx.fillRect(0, 0, 256, 48);
              ctx.font = "22px monospace";
              ctx.fillStyle = "#ffffff";
              ctx.textAlign = "center";
              ctx.fillText(mesh.name, 128, 32);
            }
            const texture = new CanvasTexture(canvas);
            const material = new SpriteMaterial({
              map: texture,
              depthTest: false,
            });
            const sprite = new Sprite(material);
            sprite.position.copy(
              new Box3().setFromObject(mesh).getCenter(new Vector3()),
            );
            sprite.scale.set(0.65, 0.12, 1);
            return sprite;
          })
        : [],
    [prepared, debug?.names],
  );
  useEffect(
    () => () =>
      labels.forEach((sprite) => {
        sprite.material.map?.dispose();
        sprite.material.dispose();
      }),
    [labels],
  );
  function select(event: ThreeEvent<MouseEvent>) {
    const name = event.object.name;
    const metadataKey = event.object.userData.key;
    const key =
      profile.keys[name] ??
      (typeof metadataKey === "string" ? metadataKey : undefined) ??
      (name.startsWith("Key_") ? name.slice(4) : undefined);
    if (key) {
      event.stopPropagation();
      onKey?.(key);
    }
    if (debug && onInfo) onInfo({ ...prepared.info, selected: name });
  }
  return (
    <>
      <primitive object={prepared.scene} onClick={select} />
      {prepared.fallback && <primitive object={prepared.fallback} />}
      <MinitelScreen
        source={screenSource}
        mesh={prepared.screen}
        effects={effects}
        reducedMotion={reducedMotion}
      />
      {debug?.axes && <axesHelper args={[3]} />}
      {(debug?.bounds || (debug && selectedName)) && (
        <primitive object={helper} />
      )}
      {labels.map((sprite) => (
        <primitive key={sprite.uuid} object={sprite} />
      ))}
    </>
  );
}
