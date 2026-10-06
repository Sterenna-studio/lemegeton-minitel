// Moteur des yeux de Lemegeton sur l'ecran Videotex. Reprend FaceRenderer de
// minitel-face : lecteur de sequences, mode autonome (clignements 1-6 s dont
// 40 % doubles, regard 2,2-5,2 s, reactions 9-16 s) et touches Minitel.
import { createScreen, text, type TerminalFrame } from "../videotex/screen";
import { paintRows, type VideotexColor } from "../videotex/mosaic";
import {
  buildEyes,
  initialEyeState,
  REACTIONS,
  SEQUENCES,
  type EyeState,
  type Mood,
  type SequenceName,
  type SequenceStep,
} from "./libEyes";
import { buildZyraEyes } from "./libZyraEyes";

/** Palettes de l'overlay OBS (nitro-clicker COLOR_PRESETS) ramenees aux 8 couleurs Videotex. */
export const EYE_PALETTES = [
  { id: "cyan", label: "Cyan Lemegeton", color: "CYAN" },
  { id: "auto", label: "Auto (humeurs Zyra)", color: "AUTO" },
  { id: "phosphore", label: "Phosphore", color: "VERT" },
  { id: "ambre", label: "Ambre", color: "JAUNE" },
  { id: "rouge", label: "Rouge", color: "ROUGE" },
  { id: "nitro", label: "Nitro", color: "MAGENTA" },
  { id: "blanc", label: "Blanc", color: "BLANC" },
] as const satisfies readonly { id: string; label: string; color: VideotexColor | "AUTO" }[];
export type EyePaletteId = (typeof EYE_PALETTES)[number]["id"];

/** Formes reprises de minitel-face : capsules Zyra Eyes ou yeux LibEyes. */
export const EYE_STYLES = [
  { id: "zyra", label: "Zyra (capsule)" },
  { id: "classique", label: "Classique (LibEyes)" },
] as const;
export type EyeStyleId = (typeof EYE_STYLES)[number]["id"];

const MOOD_LABELS: Record<Mood, string> = {
  default: "NEUTRE",
  happy: "JOIE",
  angry: "COLERE",
  surprised: "SURPRISE",
  tired: "FATIGUE",
  fear: "PEUR",
  disgust: "DEGOUT",
  love: "AMOUR",
};

export interface EyesSnapshot {
  frame: TerminalFrame;
  state: EyeState;
  palette: EyePaletteId;
  style: EyeStyleId;
}

export interface EyesOptions {
  palette?: EyePaletteId;
  style?: EyeStyleId;
  random?: () => number;
}

const AUTO = {
  blink: [1000, 6000],
  gaze: [2200, 5200],
  reaction: [9000, 16000],
} as const;

export class EyesController {
  private state: EyeState = { ...initialEyeState };
  private palette: EyePaletteId;
  private style: EyeStyleId;
  private random: () => number;
  private listeners = new Set<() => void>();
  private snapshot: EyesSnapshot;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private sequenceToken = 0;
  private running = false;
  private autonomous = false;

  constructor(options: EyesOptions = {}) {
    this.palette = options.palette ?? "cyan";
    this.style = options.style ?? "zyra";
    this.random = options.random ?? Math.random;
    this.snapshot = this.build();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = (): EyesSnapshot => this.snapshot;

  private build(): EyesSnapshot {
    const color = EYE_PALETTES.find((p) => p.id === this.palette)?.color ?? "CYAN";
    const frame = createScreen("YEUX DE LEMEGETON", "LEMEGETON");
    paintRows(
      frame,
      this.style === "zyra"
        ? buildZyraEyes(this.state, color)
        : buildEyes(this.state, color === "AUTO" ? "BLANC" : color),
    );
    const mood = this.state.moodOverride ?? this.state.mood;
    const label = `HUMEUR : ${MOOD_LABELS[mood]}`;
    text(frame, Math.floor((40 - label.length) / 2), 22, label, 4);
    return { frame, state: { ...this.state }, palette: this.palette, style: this.style };
  }
  private emit() {
    this.snapshot = this.build();
    this.listeners.forEach((listener) => listener());
  }
  private update(patch: Partial<EyeState>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  setPalette(palette: EyePaletteId) {
    this.palette = palette;
    this.emit();
  }
  setStyle(style: EyeStyleId) {
    this.style = style;
    this.emit();
  }
  setMood(mood: Mood) {
    this.update({ mood, moodOverride: null, eyeState: null, eyeOpen: true });
  }
  setGaze(x: number, y: number) {
    const clamp = (v: number) => Math.max(-1, Math.min(1, Math.round(v)));
    this.update({ gazeX: clamp(x), gazeY: clamp(y) });
  }

  /** Joue une sequence ; une nouvelle sequence interrompt la precedente. */
  async play(name: SequenceName): Promise<void> {
    const token = ++this.sequenceToken;
    this.running = true;
    const steps: SequenceStep[] = SEQUENCES[name];
    for (const step of steps) {
      if (token !== this.sequenceToken) return;
      const patch: Partial<EyeState> = {};
      if (step.eyeState !== undefined) patch.eyeState = step.eyeState;
      if (step.moodOverride !== undefined) patch.moodOverride = step.moodOverride;
      if (step.gazeX !== undefined) patch.gazeX = step.gazeX;
      if (step.gazeY !== undefined) patch.gazeY = step.gazeY;
      this.update(patch);
      if (step.delayMs) await this.wait(step.delayMs);
    }
    if (token === this.sequenceToken) this.running = false;
  }

  /**
   * Touches Minitel, comme sur le Minitel physique (minitel-face, README) :
   * Envoi joie, Retour neutre ou reveil, Repetition regard circulaire,
   * Guide surprise, Annulation colere, Sommaire endormissement,
   * Correction fatigue, Suite clin d'oeil.
   */
  key(key: string): boolean {
    const name = { Enter: "Envoi", Escape: "Sommaire", Backspace: "Correction" }[key] ?? key;
    switch (name) {
      case "Envoi":
        this.setMood("happy");
        return true;
      case "Retour":
        if (this.state.eyeState === "closed") void this.play("wake_up");
        else this.setMood("default");
        return true;
      case "Repetition":
        void this.play("look_around");
        return true;
      case "Guide":
        void this.play("surprised");
        return true;
      case "Annulation":
        this.setMood("angry");
        return true;
      case "Sommaire":
        void this.play("fall_asleep");
        return true;
      case "Correction":
        this.setMood("tired");
        return true;
      case "Suite":
        void this.play("wink");
        return true;
    }
    return false;
  }

  /** Mode autonome : clignements, regard et reactions spontanes. */
  start() {
    if (this.autonomous) return;
    this.autonomous = true;
    this.scheduleBlink();
    this.scheduleGaze();
    this.scheduleReaction();
  }
  stop() {
    this.autonomous = false;
    this.sequenceToken++;
    this.running = false;
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }

  private wait(ms: number) {
    return new Promise<void>((resolve) => this.later(resolve, ms));
  }
  private later(callback: () => void, ms: number) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, ms);
    this.timers.add(timer);
  }
  private delay([min, max]: readonly [number, number]) {
    return Math.round(min + this.random() * (max - min));
  }
  private scheduleBlink() {
    this.later(() => {
      if (!this.autonomous) return;
      // Web-Eye-Animation : environ 60 % de clignements simples, 40 % doubles.
      if (!this.running) void this.play(this.random() >= 0.6 ? "double_blink" : "blink");
      this.scheduleBlink();
    }, this.delay(AUTO.blink));
  }
  private scheduleGaze() {
    this.later(() => {
      if (!this.autonomous) return;
      if (!this.running) {
        const x = [-1, 0, 0, 1][Math.floor(this.random() * 4)];
        const y = [-1, 0, 0, 0, 1][Math.floor(this.random() * 5)];
        this.setGaze(x, y);
      }
      this.scheduleGaze();
    }, this.delay(AUTO.gaze));
  }
  private scheduleReaction() {
    this.later(() => {
      if (!this.autonomous) return;
      if (!this.running) void this.play(REACTIONS[Math.floor(this.random() * REACTIONS.length)]);
      this.scheduleReaction();
    }, this.delay(AUTO.reaction));
  }
}
