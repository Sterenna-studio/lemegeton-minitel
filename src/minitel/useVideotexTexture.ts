import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TerminalFrame } from '../videotex/screen';
import { renderTerminal, WIDTH, HEIGHT, type CrtEffects } from '../videotex/renderer';

const BLINK_PERIOD = 600;

/** Canvas texture redrawn only when the frame, the effects or the blink phase change. */
export function useVideotexTexture(frame: TerminalFrame, effects: CrtEffects, reducedMotion: boolean): THREE.CanvasTexture {
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH; canvas.height = HEIGHT;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    // glTF UVs put v=0 at the top of the image, like textures loaded by GLTFLoader.
    texture.flipY = false;
    texture.anisotropy = 4;
    return { canvas, texture };
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  const drawn = useRef<{ frame?: TerminalFrame; effects?: CrtEffects; reduced?: boolean; phase?: number }>({});
  useFrame(() => {
    const time = performance.now();
    const animated = effects.flicker && !reducedMotion;
    const phase = reducedMotion ? 0 : Math.floor(time / BLINK_PERIOD) % 2;
    const last = drawn.current;
    if (!animated && last.frame === frame && last.effects === effects && last.reduced === reducedMotion && last.phase === phase) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderTerminal(ctx, frame, effects, time, reducedMotion);
    texture.needsUpdate = true;
    drawn.current = { frame, effects, reduced: reducedMotion, phase };
  });
  return texture;
}
