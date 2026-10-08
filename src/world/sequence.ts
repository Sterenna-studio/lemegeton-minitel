// Timeline of the temporal door (docs/MONDE_EXPLORABLE.md, §5), as a pure
// function of time : t (s) -> state of every moving part. The 3D layer only
// applies it. The return trip plays the same timeline with the years swapped.

export const SEQUENCE_DURATION = 3;
/** Travel through the open door, after the sequence. */
export const PASSAGE_DURATION = 1.2;
/** Peak of clockSpeed : 7,200 times real time, two minute-hand turns a second. */
export const CLOCK_PEAK = 7200;

export interface Roller {
  from: string;
  to: string;
  /** 0 : shows `from`, 1 : shows `to` ; in between the roller turns. */
  progress: number;
}

export interface DoorState {
  /** Handle turn, 0 -> 1 -> 0. */
  handle: number;
  /** One roller per character of the year. */
  counter: Roller[];
  /**
   * How fast time runs on the grandfather clock (1 = real time). Peaks at
   * 7,200 : the minute hand then makes two turns a second.
   */
  clockSpeed: number;
  /** Era light filtering through the gap, 0 -> 1. */
  glow: number;
  /** Opening of the leaf, 0 (closed) -> 1 (openAngle). */
  leaf: number;
  /** Tick sound rate factor (1 = one tick per second). */
  tickRate: number;
  done: boolean;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Progress of t within [start, end]. */
const span = (t: number, start: number, end: number) => clamp01((t - start) / (end - start));
const smooth = (x: number) => x * x * (3 - 2 * x);

/**
 * State of the door at time t. Rollers turn from right to left, as on a
 * mechanical counter, between 0.2 s and 1.4 s ; unchanged characters stay
 * still. Years are padded to the same length.
 */
export function doorSequence(t: number, fromYear: string, toYear: string): DoorState {
  const length = Math.max(fromYear.length, toYear.length);
  const from = fromYear.padStart(length, " ");
  const to = toYear.padStart(length, " ");
  const counter: Roller[] = [];
  for (let i = 0; i < length; i++) {
    // Rightmost roller starts first ; each one lasts 0.6 s.
    const order = length - 1 - i;
    const start = 0.2 + (order * 0.6) / Math.max(1, length - 1);
    counter.push({
      from: from[i],
      to: to[i],
      progress: from[i] === to[i] ? 1 : smooth(span(t, start, start + 0.6)),
    });
  }
  const handleIn = span(t, 0, 0.3);
  const handleOut = span(t, 1.6, 1.9);
  const spin = span(t, 0.6, 1.6);
  return {
    handle: handleIn - handleOut,
    counter,
    // Hands race, then calm down when the leaf opens.
    clockSpeed: 1 + (CLOCK_PEAK - 1) * Math.sin(Math.PI * spin),
    glow: smooth(span(t, 1.2, 2.0)),
    leaf: smooth(span(t, 1.6, 3.0)),
    tickRate: 1 + 7 * span(t, 0.2, 1.4) * (1 - span(t, 1.6, 2.2)),
    done: t >= SEQUENCE_DURATION,
  };
}

/** Text shown by the counter : each roller shows its nearest face. */
export function counterText(counter: Roller[]): string {
  return counter.map((roller) => (roller.progress < 0.5 ? roller.from : roller.to)).join("");
}
