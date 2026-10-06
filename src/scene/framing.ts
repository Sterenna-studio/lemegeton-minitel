import type { Vec3 } from "../minitel/types";

// Camera framings. "desk" shows the terminal on its side table (the table top
// is at y = 0, the table goes down to y = -5.95) ; "floor" frames a terminal
// standing on the floor. Pure data : the browser tests reuse these values.
export interface Framing {
  target: Vec3;
  reset: { wide: Vec3; narrow: Vec3 };
  front: { wide: Vec3; narrow: Vec3 };
  side: { wide: Vec3; narrow: Vec3 };
  back: { wide: Vec3; narrow: Vec3 };
  minDistance: number;
  maxDistance: number;
}

export const framings: Record<"desk" | "floor", Framing> = {
  floor: {
    target: [0, 1, 0.3],
    reset: { wide: [4, 3.2, 7.3], narrow: [2.5, 3.5, 10.5] },
    front: { wide: [0, 2.5, 7.3], narrow: [0, 2.5, 9.5] },
    side: { wide: [7.3, 2.5, 0.3], narrow: [9.5, 2.5, 0.3] },
    back: { wide: [0, 2.5, -7.3], narrow: [0, 2.5, -9.5] },
    minDistance: 3.8,
    maxDistance: 11,
  },
  desk: {
    target: [0, -0.9, 0.6],
    reset: { wide: [5.4, 3.6, 10.6], narrow: [3.4, 4.6, 15] },
    front: { wide: [0, 2.2, 11], narrow: [0, 2.6, 14.5] },
    side: { wide: [11, 2.2, 0.6], narrow: [14.5, 2.6, 0.6] },
    back: { wide: [0, 2.2, -11], narrow: [0, 2.6, -14.5] },
    minDistance: 4.5,
    maxDistance: 17,
  },
};
