import type { Vec3 } from "./types";

/**
 * Uniform Catmull-Rom spline through the points, at k (0-1), ends clamped. It
 * passes through every point ; pure, so the camera pose is testable without three.
 */
export function catmullRom(points: Vec3[], k: number): Vec3 {
  if (points.length === 1) return points[0];
  const segments = points.length - 1;
  const x = Math.min(segments, Math.max(0, k * segments));
  const i = Math.min(segments - 1, Math.floor(x));
  const t = x - i;
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[Math.min(points.length - 1, i + 2)];
  const t2 = t * t;
  const t3 = t2 * t;
  return [0, 1, 2].map(
    (c) =>
      0.5 *
      (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3),
  ) as Vec3;
}
