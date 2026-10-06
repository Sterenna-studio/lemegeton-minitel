import type { Texture } from "three";
import type { TerminalFrame } from "../videotex/screen";
export type Vec3 = [number, number, number];
export type ScreenSource =
  | { kind: "videotex"; frame: TerminalFrame }
  | {
      kind: "canvas";
      canvas: HTMLCanvasElement;
      revision: number;
      continuous?: boolean;
      accessibleText: string;
    }
  | {
      kind: "texture";
      texture: Texture;
      accessibleText: string;
      continuous?: boolean;
    };
export interface Anchor {
  position: Vec3;
  rotation?: Vec3;
}
export interface ModelProfile {
  normalize: boolean;
  screenNames: string[];
  screenFallback: { position: Vec3; rotation?: Vec3; size: [number, number] };
  /** Centre of the screen in the presentation frame ; the camera aims at it. */
  screenCenter?: Vec3;
  /**
   * Bombe du verre (unites du modele) applique a un ecran plat, comme un tube
   * cathodique. Toujours actif, independamment des effets CRT.
   */
  screenBulge?: number;
  anchors: Record<string, Anchor>;
  keys: Record<string, string>;
}
export interface ModelInfo {
  meshes: { name: string; vertices: number }[];
  triangles: number;
  textures: number;
  selected?: string;
  camera?: Vec3;
  fps?: number;
  drawCalls?: number;
}
