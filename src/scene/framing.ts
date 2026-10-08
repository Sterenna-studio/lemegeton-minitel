import type { ModelProfile, ScreenFocus, Vec3 } from "../minitel/types";

// Camera framings. The camera always aims at the centre of the terminal's
// screen ; each view is an offset from that point. "desk" stands further back
// to show the side table, "floor" frames a terminal standing on the floor.
// Pure data : the browser tests reuse these values. minDistance lets the
// screen fill about 80 % of the height at full zoom (2026-10-08).
type View = { wide: Vec3; narrow: Vec3 };
export interface Framing {
  reset: View;
  front: View;
  side: View;
  back: View;
  minDistance: number;
  maxDistance: number;
}

export const framings: Record<"desk" | "floor", Framing> = {
  floor: {
    reset: { wide: [4, 2.2, 7], narrow: [2.5, 2.5, 10.2] },
    front: { wide: [0, 1.5, 7], narrow: [0, 1.5, 9.2] },
    side: { wide: [7, 1.5, 0], narrow: [9.2, 1.5, 0] },
    back: { wide: [0, 1.5, -7], narrow: [0, 1.5, -9.2] },
    minDistance: 2.6,
    maxDistance: 11,
  },
  desk: {
    reset: { wide: [5.2, 3.2, 9.6], narrow: [3.4, 4, 13.5] },
    front: { wide: [0, 1.6, 10.5], narrow: [0, 2, 13.5] },
    side: { wide: [10.5, 1.6, 0], narrow: [13.5, 2, 0] },
    back: { wide: [0, 1.6, -10.5], narrow: [0, 2, -13.5] },
    minDistance: 3,
    maxDistance: 17,
  },
};

/** Point the camera aims at : the screen centre declared by the profile. */
export function cameraTarget(profile: ModelProfile): Vec3 {
  return profile.screenCenter ?? profile.screenFallback.position;
}

/** Share of the view the screen takes in the focus view (double-click). */
export const FOCUS_FILL = 0.8;

/**
 * Distance at which the screen fills FOCUS_FILL of the view, whichever of its
 * width or height is the tighter constraint for this aspect ratio.
 */
export function focusDistance(screen: ScreenFocus, fovDegrees: number, aspect: number): number {
  const tan = Math.tan((fovDegrees * Math.PI) / 360);
  return Math.max(screen.height / FOCUS_FILL / (2 * tan), screen.width / FOCUS_FILL / (2 * tan * aspect));
}

/** Focus view : straight in front of the glass, at focusDistance. */
export function focusPosition(target: Vec3, screen: ScreenFocus, fovDegrees: number, aspect: number): Vec3 {
  const d = focusDistance(screen, fovDegrees, aspect);
  return [target[0] + screen.normal[0] * d, target[1] + screen.normal[1] * d, target[2] + screen.normal[2] * d];
}

/** Camera position for a view : target + offset. */
export function viewPosition(target: Vec3, offset: Vec3): Vec3 {
  return [target[0] + offset[0], target[1] + offset[1], target[2] + offset[2]];
}
