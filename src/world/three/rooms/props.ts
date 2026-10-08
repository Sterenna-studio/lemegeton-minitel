import {
  BufferGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  LatheGeometry,
  Matrix4,
  PlaneGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { seeded } from "../kit";
import type { Vec3 } from "../../types";

// Geometry of the room props that are not boxes : tapered legs, a vase, a
// curtain, plants, a rope. Each returns one merged geometry (one draw call).

/**
 * Tapered legs under a piece of furniture, splayed outwards from its centre
 * (mid-century style) : feet at `feet` (y = 0), `height` tall.
 */
export function taperedLegs(feet: [number, number][], height: number, top = 0.2, bottom = 0.1, splay = 0.16): BufferGeometry {
  return mergeGeometries(
    feet.map(([x, z]) => {
      const leg = new CylinderGeometry(top, bottom, height, 10);
      // Pivot at the top of the leg, where it meets the furniture.
      leg.translate(0, -height / 2, 0);
      const length = Math.hypot(x, z) || 1;
      // The foot moves outwards, along (x, z).
      leg.applyMatrix4(new Matrix4().makeRotationAxis(new Vector3(z / length, 0, -x / length), -splay));
      leg.translate(x, height, z);
      return leg;
    }),
  );
}

/** A cylinder standing on (x, z), from y0 to y1. */
export function post(x: number, z: number, y0: number, y1: number, radius: number, radiusBottom = radius): BufferGeometry {
  const cylinder = new CylinderGeometry(radius, radiusBottom, y1 - y0, 14);
  cylinder.translate(x, (y0 + y1) / 2, z);
  return cylinder;
}

/** Turned vase, `height` tall, standing at the origin. */
export function vase(height: number, belly: number): BufferGeometry {
  const profile = [
    [0, 0],
    [belly * 0.55, 0],
    [belly * 0.9, height * 0.25],
    [belly, height * 0.45],
    [belly * 0.55, height * 0.8],
    [belly * 0.42, height * 0.92],
    [belly * 0.55, height],
  ].map(([r, y]) => new Vector2(r, y));
  return new LatheGeometry(profile, 24);
}

/** A hanging curtain with soft folds, centred, from y = 0 to `height`. */
export function curtain(width: number, height: number, folds: number, depth = 0.35): BufferGeometry {
  const plane = new PlaneGeometry(width, height, folds * 6, 1);
  const position = plane.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    position.setZ(i, Math.sin((x / width + 0.5) * folds * Math.PI * 2) * depth);
  }
  plane.computeVertexNormals();
  plane.translate(0, height / 2, 0);
  return plane;
}

/**
 * Leaves of a plant : `count` long thin cones from the top of the stem(s),
 * arching outwards. `rosettes` are the points they grow from.
 */
export function leaves(rosettes: Vec3[], count: number, length: number, width: number, seed: number): BufferGeometry {
  const random = seeded(seed);
  const parts: BufferGeometry[] = [];
  for (const [x, y, z] of rosettes) {
    for (let i = 0; i < count; i++) {
      const height = length * (0.7 + random() * 0.5);
      const leaf = new ConeGeometry(width, height, 4);
      leaf.scale(1, 1, 0.25);
      // Base at the rosette, tip outwards.
      leaf.translate(0, height / 2, 0);
      const turn = (i / count) * Math.PI * 2 + random() * 0.4;
      const lean = 0.35 + random() * 0.9;
      leaf.applyMatrix4(new Matrix4().makeRotationX(lean));
      leaf.applyMatrix4(new Matrix4().makeRotationY(turn));
      leaf.translate(x, y, z);
      parts.push(leaf);
    }
  }
  return mergeGeometries(parts);
}

/** Round leaves of a bush (a fern stand, a ficus). */
export function bush(centre: Vec3, radius: number, count: number, seed: number): BufferGeometry {
  const random = seeded(seed);
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const ball = new SphereGeometry(radius * (0.35 + random() * 0.3), 8, 6);
    ball.scale(1, 0.7, 1);
    const a = random() * Math.PI * 2;
    const r = random() * radius;
    ball.translate(centre[0] + Math.cos(a) * r, centre[1] + (random() - 0.3) * radius, centre[2] + Math.sin(a) * r);
    parts.push(ball);
  }
  return mergeGeometries(parts);
}

/** A rope hanging between points (a catenary through a sagging middle). */
export function rope(from: Vec3, to: Vec3, sag: number, radius: number): BufferGeometry {
  const middle = new Vector3((from[0] + to[0]) / 2, (from[1] + to[1]) / 2 - sag, (from[2] + to[2]) / 2);
  const curve = new CatmullRomCurve3([new Vector3(...from), middle, new Vector3(...to)]);
  return new TubeGeometry(curve, 24, radius, 8, false);
}
