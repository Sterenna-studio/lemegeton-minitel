// Portage TypeScript de minitel-face/src/libs/LibEyes.js (Sterenna) :
// les yeux seuls, le cadre du Minitel est le visage. LibEyes s'inspire de
// Web-Eye-Animation (CyberAgentAILab, MIT), l'animation des yeux de l'overlay
// OBS de Lemegeton (nitro-clicker), transposee en mosaique Videotex 40 x 24.
// Memes formes, memes sequences ; seule la couleur devient un parametre.
import type { RowPatch, VideotexColor } from "../videotex/mosaic";

const L = { COL: 7, W: 7, PUP: 10 };
const R = { COL: 24, W: 7, PUP: 27 };
const EYE_TOP = 9;
const EYE_MID = 11;
const EYE_BOT = 13;
const FULL = 0x7f;
const HALF_TOP = 0x70;
const EMPTY = 0x20;

export type Mood =
  | "default"
  | "happy"
  | "angry"
  | "surprised"
  | "tired"
  | "fear"
  | "disgust"
  | "love";
export type EyeOverride = "closed" | "half" | "wink_left" | "wink_right";

export interface EyeState {
  mood: Mood;
  moodOverride: Mood | null;
  eyeState: EyeOverride | null;
  eyeOpen: boolean;
  /** -1, 0 ou 1 */
  gazeX: number;
  gazeY: number;
}

export const initialEyeState: EyeState = {
  mood: "default",
  moodOverride: null,
  eyeState: null,
  eyeOpen: true,
  gazeX: 0,
  gazeY: 0,
};

const eyeRow = (row: number, col: number, w: number, color: VideotexColor): RowPatch => [
  row, col, color, Array(w).fill(FULL),
];
function pupilRow(row: number, pupCol: number, eyeCol: number, eyeW: number, color: VideotexColor): RowPatch {
  const bytes = Array(eyeW).fill(FULL);
  bytes[Math.max(0, Math.min(eyeW - 1, pupCol - eyeCol))] = EMPTY;
  return [row, eyeCol, color, bytes];
}

function eyeOpen(pupX: number, c: VideotexColor): RowPatch[] {
  return [
    eyeRow(EYE_TOP, L.COL, L.W, c),
    pupilRow(EYE_MID, L.PUP + pupX, L.COL, L.W, c),
    eyeRow(EYE_BOT, L.COL, L.W, c),
    eyeRow(EYE_TOP, R.COL, R.W, c),
    pupilRow(EYE_MID, R.PUP + pupX, R.COL, R.W, c),
    eyeRow(EYE_BOT, R.COL, R.W, c),
  ];
}
function eyeOpenGazeY(pupX: number, pupY: number, c: VideotexColor): RowPatch[] {
  const pRow = EYE_MID + pupY;
  const rows: RowPatch[] = [];
  for (let r = EYE_TOP; r <= EYE_BOT; r++)
    if (r === pRow)
      rows.push(pupilRow(r, L.PUP + pupX, L.COL, L.W, c), pupilRow(r, R.PUP + pupX, R.COL, R.W, c));
    else rows.push(eyeRow(r, L.COL, L.W, c), eyeRow(r, R.COL, R.W, c));
  return rows;
}
const eyeClosed = (c: VideotexColor): RowPatch[] => [
  [EYE_MID, L.COL, c, Array(L.W).fill(HALF_TOP)],
  [EYE_MID, R.COL, c, Array(R.W).fill(HALF_TOP)],
];
const eyeHalf = (pupX: number, c: VideotexColor): RowPatch[] => [
  pupilRow(EYE_MID, L.PUP + pupX, L.COL, L.W, c),
  eyeRow(EYE_BOT, L.COL, L.W, c),
  pupilRow(EYE_MID, R.PUP + pupX, R.COL, R.W, c),
  eyeRow(EYE_BOT, R.COL, R.W, c),
];
const eyeHappy = (c: VideotexColor): RowPatch[] => [
  [EYE_BOT, L.COL, c, Array(L.W).fill(FULL)],
  [EYE_BOT, R.COL, c, Array(R.W).fill(FULL)],
];
function eyeAngry(pupX: number, c: VideotexColor): RowPatch[] {
  const left = Array(L.W).fill(FULL);
  left[Math.max(0, Math.min(L.W - 1, L.PUP + pupX + 1 - L.COL))] = EMPTY;
  const right = Array(R.W).fill(FULL);
  right[Math.max(0, Math.min(R.W - 1, R.PUP + pupX - 1 - R.COL))] = EMPTY;
  return [
    [EYE_MID, L.COL, c, left],
    eyeRow(EYE_BOT, L.COL, L.W, c),
    [EYE_MID, R.COL, c, right],
    eyeRow(EYE_BOT, R.COL, R.W, c),
  ];
}
const eyeSurprised = (c: VideotexColor): RowPatch[] => [
  eyeRow(EYE_TOP - 1, L.COL - 1, L.W + 2, c),
  eyeRow(EYE_TOP, L.COL, L.W, c),
  [EYE_MID, L.COL, c, Array(L.W).fill(FULL)],
  eyeRow(EYE_BOT, L.COL, L.W, c),
  eyeRow(EYE_TOP - 1, R.COL - 1, R.W + 2, c),
  eyeRow(EYE_TOP, R.COL, R.W, c),
  [EYE_MID, R.COL, c, Array(R.W).fill(FULL)],
  eyeRow(EYE_BOT, R.COL, R.W, c),
];
const eyeDisgust = (c: VideotexColor): RowPatch[] => [
  [EYE_MID, L.COL, c, Array(L.W).fill(HALF_TOP)],
  [EYE_BOT, L.COL, c, Array(L.W).fill(FULL)],
  [EYE_MID, R.COL, c, Array(R.W).fill(HALF_TOP)],
  [EYE_BOT, R.COL, c, Array(R.W).fill(FULL)],
];
const heartBottom = [FULL, FULL, EMPTY, EMPTY, EMPTY, FULL, FULL];
const eyeLove = (c: VideotexColor): RowPatch[] => [
  eyeRow(EYE_TOP, L.COL, L.W, c),
  eyeRow(EYE_MID, L.COL, L.W, c),
  [EYE_BOT, L.COL, c, [...heartBottom]],
  eyeRow(EYE_TOP, R.COL, R.W, c),
  eyeRow(EYE_MID, R.COL, R.W, c),
  [EYE_BOT, R.COL, c, [...heartBottom]],
];
const eyeWinkLeft = (pupX: number, c: VideotexColor): RowPatch[] => [
  [EYE_MID, L.COL, c, Array(L.W).fill(HALF_TOP)],
  eyeRow(EYE_TOP, R.COL, R.W, c),
  pupilRow(EYE_MID, R.PUP + pupX, R.COL, R.W, c),
  eyeRow(EYE_BOT, R.COL, R.W, c),
];
const eyeWinkRight = (pupX: number, c: VideotexColor): RowPatch[] => [
  eyeRow(EYE_TOP, L.COL, L.W, c),
  pupilRow(EYE_MID, L.PUP + pupX, L.COL, L.W, c),
  eyeRow(EYE_BOT, L.COL, L.W, c),
  [EYE_MID, R.COL, c, Array(R.W).fill(HALF_TOP)],
];

/** Rangees Videotex des deux yeux pour un etat (buildEyes de LibEyes). */
export function buildEyes(state: EyeState, color: VideotexColor = "BLANC"): RowPatch[] {
  const { gazeX: pupX, gazeY: pupY } = state;
  const mood = state.moodOverride ?? state.mood;
  if (!state.eyeOpen || state.eyeState === "closed") return eyeClosed(color);
  if (state.eyeState === "half") return eyeHalf(pupX, color);
  if (state.eyeState === "wink_left") return eyeWinkLeft(pupX, color);
  if (state.eyeState === "wink_right") return eyeWinkRight(pupX, color);
  if (mood === "happy") return eyeHappy(color);
  if (mood === "angry") return eyeAngry(pupX, color);
  if (mood === "surprised") return eyeSurprised(color);
  if (mood === "tired") return eyeHalf(pupX, color);
  if (mood === "fear") return eyeOpenGazeY(pupX, -1, color);
  if (mood === "disgust") return eyeDisgust(color);
  if (mood === "love") return eyeLove(color);
  if (pupY !== 0) return eyeOpenGazeY(pupX, pupY, color);
  return eyeOpen(pupX, color);
}

export interface SequenceStep {
  eyeState?: EyeOverride | null;
  moodOverride?: Mood | null;
  gazeX?: number;
  gazeY?: number;
  delayMs: number;
}

/** Sequences de LibEyes (dont le mapping Web-Eye-Animation). */
export const SEQUENCES = {
  blink: [{ eyeState: "closed", delayMs: 120 }, { eyeState: null, delayMs: 0 }],
  double_blink: [
    { eyeState: "closed", delayMs: 100 },
    { eyeState: null, delayMs: 150 },
    { eyeState: "closed", delayMs: 100 },
    { eyeState: null, delayMs: 0 },
  ],
  look_around: [{ gazeX: -1, delayMs: 600 }, { gazeX: 1, delayMs: 600 }, { gazeX: 0, delayMs: 0 }],
  fall_asleep: [
    { moodOverride: "tired", eyeState: "half", delayMs: 1000 },
    { eyeState: "closed", delayMs: 0 },
  ],
  wake_up: [
    { eyeState: "half", delayMs: 500 },
    { eyeState: null, delayMs: 200 },
    { eyeState: "closed", delayMs: 100 },
    { eyeState: null, moodOverride: null, delayMs: 0 },
  ],
  wink: [{ eyeState: "wink_left", delayMs: 180 }, { eyeState: null, delayMs: 0 }],
  wink_right: [{ eyeState: "wink_right", delayMs: 180 }, { eyeState: null, delayMs: 0 }],
  joy: [
    { moodOverride: "happy", delayMs: 200 },
    { eyeState: "closed", delayMs: 150 },
    { eyeState: null, delayMs: 200 },
    { moodOverride: null, delayMs: 0 },
  ],
  sadness: [
    { moodOverride: "tired", delayMs: 800 },
    { gazeY: 1, delayMs: 600 },
    { gazeY: 0, moodOverride: null, delayMs: 0 },
  ],
  surprised: [{ moodOverride: "surprised", delayMs: 900 }, { moodOverride: null, delayMs: 0 }],
  fear: [
    { moodOverride: "fear", delayMs: 200 },
    { eyeState: "closed", delayMs: 80 },
    { eyeState: null, delayMs: 200 },
    { eyeState: "closed", delayMs: 80 },
    { eyeState: null, delayMs: 200 },
    { moodOverride: null, delayMs: 0 },
  ],
  excitement: [
    { moodOverride: "surprised", delayMs: 200 },
    { eyeState: "closed", delayMs: 100 },
    { eyeState: null, delayMs: 150 },
    { eyeState: "closed", delayMs: 100 },
    { eyeState: null, delayMs: 150 },
    { moodOverride: null, delayMs: 0 },
  ],
  confusion: [
    { gazeX: -1, delayMs: 300 },
    { gazeX: 1, delayMs: 300 },
    { gazeX: -1, delayMs: 300 },
    { gazeX: 0, delayMs: 0 },
  ],
  love: [
    { moodOverride: "love", delayMs: 1200 },
    { eyeState: "closed", delayMs: 150 },
    { eyeState: null, delayMs: 0 },
    { moodOverride: null, delayMs: 0 },
  ],
  disgust: [{ moodOverride: "disgust", delayMs: 900 }, { moodOverride: null, delayMs: 0 }],
} satisfies Record<string, SequenceStep[]>;
export type SequenceName = keyof typeof SEQUENCES;

/** Reactions tirees par le mode autonome (FaceRenderer._scheduleAutonomousReaction). */
export const REACTIONS: SequenceName[] = [
  "joy", "sadness", "surprised", "fear", "disgust",
  "confusion", "love", "excitement", "look_around", "wink",
];
