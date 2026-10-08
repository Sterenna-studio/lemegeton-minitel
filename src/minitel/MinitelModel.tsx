import { useEffect, useMemo } from "react";
import {
  Box3,
  BoxHelper,
  Matrix3,
  CanvasTexture,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
  type Material,
} from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { ModelInfo, ModelProfile, ScreenFocus, ScreenSource } from "./types";
import type { CrtEffects } from "../videotex/renderer";
import { MinitelScreen } from "./MinitelScreen";
import { useModel } from "../scene/loaders";
import { bulgedScreenGeometry } from "./bulge";
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
  /** Stops the screen updates while the terminal is out of view. */
  paused?: boolean;
  /** Orientation and size of the screen, once the model is prepared. */
  onScreen?: (screen: ScreenFocus) => void;
  /** Double-click (or double tap) on the glass. */
  onScreenDoubleClick?: () => void;
}
/**
 * Where the glass faces and how big it is, in the frame of the model : mean of
 * the screen normals (the glass is bulged), turned towards +z (the side the
 * default views look from), and the extent of its bounding box.
 */
function screenFocusOf(scene: Object3D, screen: Mesh): ScreenFocus {
  scene.updateMatrixWorld(true);
  const normals = screen.geometry.getAttribute("normal");
  const normal = new Vector3();
  if (normals)
    for (let i = 0; i < normals.count; i++) normal.add(new Vector3().fromBufferAttribute(normals, i));
  normal.applyMatrix3(new Matrix3().getNormalMatrix(screen.matrixWorld));
  if (normal.lengthSq() < 1e-8) normal.set(0, 0, 1);
  normal.normalize();
  if (normal.z < 0) normal.negate();
  const size = new Box3().setFromObject(screen).getSize(new Vector3());
  return { normal: normal.toArray() as [number, number, number], width: size.x, height: size.y };
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
  paused = false,
  onScreen,
  onScreenDoubleClick,
}: Props) {
  const gltf = useModel(model);
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
    // A flat screen becomes curved glass (geometry of the clone only).
    const curved =
      screen && profile.screenBulge
        ? bulgedScreenGeometry(screen.geometry.clone(), profile.screenBulge)
        : null;
    if (screen && curved) screen.geometry = curved;
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
      curved,
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
  useEffect(() => {
    onScreen?.(screenFocusOf(prepared.scene, prepared.screen));
  }, [prepared, onScreen]);
  useEffect(
    () => () => {
      prepared.materials.forEach((m) => m.dispose());
      prepared.fallback?.geometry.dispose();
      prepared.curved?.dispose();
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
      <primitive
        object={prepared.scene}
        onClick={select}
        onDoubleClick={(event: ThreeEvent<MouseEvent>) => {
          if (event.object !== prepared.screen) return;
          event.stopPropagation();
          onScreenDoubleClick?.();
        }}
      />
      {prepared.fallback && <primitive object={prepared.fallback} />}
      <MinitelScreen
        source={screenSource}
        mesh={prepared.screen}
        effects={effects}
        reducedMotion={reducedMotion}
        paused={paused}
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
