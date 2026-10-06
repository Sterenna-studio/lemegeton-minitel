import type { ModelProfile, Vec3 } from "../minitel/types";

// Camera framings. The camera always aims at the centre of the terminal's
// screen ; each view is an offset from that point. "desk" stands further back
// to show the side table, "floor" frames a terminal standing on the floor.
// Pure data : the browser tests reuse these values.
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
    minDistance: 3.8,
    maxDistance: 11,
  },
  desk: {
    reset: { wide: [5.2, 3.2, 9.6], narrow: [3.4, 4, 13.5] },
    front: { wide: [0, 1.6, 10.5], narrow: [0, 2, 13.5] },
    side: { wide: [10.5, 1.6, 0], narrow: [13.5, 2, 0] },
    back: { wide: [0, 1.6, -10.5], narrow: [0, 2, -13.5] },
    minDistance: 4.5,
    maxDistance: 17,
  },
};

/** Point the camera aims at : the screen centre declared by the profile. */
export function cameraTarget(profile: ModelProfile): Vec3 {
  return profile.screenCenter ?? profile.screenFallback.position;
}

/** Camera position for a view : target + offset. */
export function viewPosition(target: Vec3, offset: Vec3): Vec3 {
  return [target[0] + offset[0], target[1] + offset[1], target[2] + offset[2]];
}
