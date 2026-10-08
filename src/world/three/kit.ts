import { BoxGeometry, BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, MeshStandardMaterial, SRGBColorSpace, type Texture } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { assetUrl } from "../../assets";
import type { Vec3 } from "../types";

// Building blocks shared by the corridor (lot C) and the rooms (lot E) : wall
// rectangles in world units, merged boxes, PBR materials on the corridor's
// KTX2 textures, and small canvas textures for printed things.

/** Size of one texture tile, in units (1 m). */
export const TILE = 8;

/** URL of one map of a corridor texture (tools/encode_textures.mjs). */
export const textureUrl = (name: string, kind: "couleur" | "relief" | "matiere") =>
  assetUrl(`models/monde/textures/${name}_${kind}.ktx2`);
/** The three maps of a texture, in the order material() expects. */
export const textureSet = (name: string) => (["couleur", "relief", "matiere"] as const).map((kind) => textureUrl(name, kind));

/**
 * A rectangle of wall : origin, direction along the wall (u), up (v), normal.
 * UVs are world units divided by TILE, so the pattern runs on across strips.
 */
export function quad(origin: Vec3, u: Vec3, normal: Vec3, u0: number, u1: number, v0: number, v1: number) {
  const at = (a: number, b: number): Vec3 => [origin[0] + u[0] * a, origin[1] + b, origin[2] + u[2] * a];
  const corners = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(corners.flat(), 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(Array(4).fill(normal).flat(), 3));
  geometry.setAttribute(
    "uv",
    new Float32BufferAttribute([u0, v0, u1, v0, u1, v1, u0, v1].map((value) => value / TILE), 2),
  );
  // Front face towards the normal : the winding (0, 1, 2) faces u × up, that is
  // (-u.z, 0, u.x) ; flip it when the wall faces the other way.
  const facing = -u[2] * normal[0] + u[0] * normal[2];
  geometry.setIndex(facing > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
  return geometry;
}

export interface BoxSpec {
  /** Width (x), height (y), depth (z). */
  size: Vec3;
  /** Centre of the box. */
  at: Vec3;
  /** Turn around y, in radians (applied last). */
  turn?: number;
  /** Tilt around x, in radians (applied after roll). */
  tilt?: number;
  /** Roll around z, in radians (applied first). */
  roll?: number;
}

/** Many boxes as one geometry : one draw call per material. */
export function boxes(specs: BoxSpec[]): BufferGeometry {
  return mergeGeometries(
    specs.map(({ size, at, turn, tilt, roll }) => {
      const box = new BoxGeometry(...size);
      if (roll) box.rotateZ(roll);
      if (tilt) box.rotateX(tilt);
      if (turn) box.rotateY(turn);
      box.translate(...at);
      return box;
    }),
  );
}

/** Material on the corridor's KTX2 maps (colour, relief, ARM), tinted. */
export function material(maps: Texture[], color: string, extra: Partial<MeshStandardMaterial> = {}) {
  const [map, normalMap, arm] = maps;
  return new MeshStandardMaterial({
    map,
    normalMap,
    aoMap: arm,
    roughnessMap: arm,
    metalnessMap: arm,
    color: new Color(color),
    metalness: 0,
    ...extra,
  });
}

/**
 * The same maps tiled differently : clones share the GPU image (Texture.source),
 * only the repeat changes, so a room never alters the corridor's tiling.
 */
export function tiled(maps: Texture[], repeatX: number, repeatY: number): Texture[] {
  return maps.map((map) => {
    const copy = map.clone();
    copy.repeat.set(repeatX, repeatY);
    return copy;
  });
}

/** A texture drawn on a canvas (printed paper, fabric, a painted sky). */
export function canvasTexture(width: number, height: number, draw: (g: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context) draw(context);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** A seeded pseudo-random series (mulberry32) : the same decor on every visit. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
