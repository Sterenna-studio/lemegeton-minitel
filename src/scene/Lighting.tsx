import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type { PointLight } from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { Vec3 } from "../minitel/types";

// Lighting is data : each place of the explorable world gets its own preset
// (docs/MONDE_EXPLORABLE.md, §7). "terminatel" is the current look of the
// simple version : warm, matte lights and a distant amber lamp that breathes.

interface DirectionalSpec {
  position: Vec3;
  color: string;
  intensity: number;
  /** Half extent of the shadow camera, in units ; no shadow when absent. */
  shadowExtent?: number;
}
interface LampSpec {
  position: Vec3;
  color: string;
  intensity: number;
  /** Horizontal sway amplitude, in units. */
  sway: number;
}
interface LightformerSpec {
  form: "rect" | "ring";
  intensity: number;
  color: string;
  position: Vec3;
  scale: number | [number, number, number];
  rotationX?: number;
}
export interface LightingPreset {
  hemisphere: { sky: string; ground: string; intensity: number };
  key: DirectionalSpec;
  fill: DirectionalSpec;
  lamp?: LampSpec;
  environment: { intensity: number; formers: LightformerSpec[] };
}

export const terminatelLighting: LightingPreset = {
  hemisphere: { sky: "#ffdcb2", ground: "#1a120b", intensity: 1.25 },
  key: { position: [-4, 7, 5], color: "#ffcf98", intensity: 2.6, shadowExtent: 10 },
  fill: { position: [5, 4, -4], color: "#e9d8c0", intensity: 1.1 },
  lamp: { position: [-9, 3.5, -9], color: "#ff9a4d", intensity: 150, sway: 0.5 },
  // Weak, warm reflections : the finishes read as matte plastic.
  environment: {
    intensity: 0.4,
    formers: [
      { form: "rect", intensity: 1.6, color: "#ffe2bd", position: [-3, 4, 4], scale: [6, 3, 1] },
      { form: "rect", intensity: 0.8, color: "#f2dcc0", position: [4, 3, -3], scale: [4, 4, 1] },
      { form: "ring", intensity: 0.6, color: "#d79a55", position: [0, 6, 0], scale: 3, rotationX: Math.PI / 2 },
    ],
  },
};

// Corridor out of time (docs/DIRECTION_ARTISTIQUE.md) : sconces around 2,400 K,
// pools of light, very low ambient ; the lamp is a sconce flickering softly.
export const couloirLighting: LightingPreset = {
  hemisphere: { sky: "#ffb46b", ground: "#120c08", intensity: 0.35 },
  key: { position: [-6, 24, 18], color: "#ffb46b", intensity: 1.5, shadowExtent: 16 },
  fill: { position: [10, 12, -6], color: "#c9a56b", intensity: 0.3 },
  lamp: { position: [-9, 17, 5], color: "#ffb46b", intensity: 90, sway: 0 },
  environment: {
    intensity: 0.25,
    formers: [
      { form: "rect", intensity: 1.2, color: "#ffcf98", position: [-6, 12, 10], scale: [8, 4, 1] },
      { form: "ring", intensity: 0.5, color: "#b08d57", position: [0, 20, 0], scale: 4, rotationX: Math.PI / 2 },
    ],
  },
};

// Inside the corridor the sconces light the place (src/world/three/Corridor.tsx) :
// only a dim warm ambience here, no shadow-casting light, no distant lamp.
export const couloirInterieurLighting: LightingPreset = {
  hemisphere: { sky: "#ffb46b", ground: "#2a1d12", intensity: 1.1 },
  key: { position: [0, 20, 10], color: "#ffcf98", intensity: 0.45 },
  fill: { position: [0, 10, -40], color: "#c9a56b", intensity: 0.15 },
  environment: {
    intensity: 0.35,
    formers: [{ form: "rect", intensity: 1, color: "#ffcf98", position: [0, 14, 0], scale: [6, 3, 1] }],
  },
};

// A warm lamp far behind the terminal, slowly breathing like a filament or a
// flame. The scene renders on demand : the light asks for frames itself, at a
// modest rate, and stays still when the user prefers reduced motion or when
// the place is not on screen (paused).
function DistantLamp({ spec, paused }: { spec: LampSpec; paused: boolean }) {
  const light = useRef<PointLight>(null);
  const invalidate = useThree((state) => state.invalidate);
  const reducedMotion = useReducedMotion();
  const [x, y, z] = spec.position;
  useEffect(() => {
    if (reducedMotion || paused) return;
    const start = performance.now();
    const timer = window.setInterval(() => {
      const t = (performance.now() - start) / 1000;
      const lamp = light.current;
      if (!lamp) return;
      const breath = 0.5 * Math.sin(t * 1.3) + 0.3 * Math.sin(t * 2.9 + 1.7) + 0.2 * Math.sin(t * 7.1);
      lamp.intensity = spec.intensity * (1 + 0.28 * breath);
      lamp.position.x = x + spec.sway * Math.sin(t * 0.45);
      invalidate();
    }, 50);
    return () => window.clearInterval(timer);
  }, [reducedMotion, paused, invalidate, spec.intensity, spec.sway, x]);
  return <pointLight ref={light} position={[x, y, z]} color={spec.color} intensity={spec.intensity} decay={2} />;
}

export function Lighting({
  preset = terminatelLighting,
  paused = false,
}: {
  preset?: LightingPreset;
  /** Freezes the animated lights (place out of view, or during a fade). */
  paused?: boolean;
}) {
  const { hemisphere, key, fill, lamp, environment } = preset;
  const extent = key.shadowExtent;
  return (
    <>
      <hemisphereLight args={[hemisphere.sky, hemisphere.ground, hemisphere.intensity]} />
      <directionalLight
        position={key.position}
        color={key.color}
        intensity={key.intensity}
        castShadow={extent !== undefined}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-(extent ?? 10)}
        shadow-camera-right={extent ?? 10}
        shadow-camera-top={extent ?? 10}
        shadow-camera-bottom={-(extent ?? 10)}
        shadow-bias={-0.001}
      />
      <directionalLight position={fill.position} color={fill.color} intensity={fill.intensity} />
      {lamp && <DistantLamp spec={lamp} paused={paused} />}
      <Environment frames={1} resolution={128} environmentIntensity={environment.intensity}>
        {environment.formers.map((former, index) => (
          <Lightformer
            key={index}
            form={former.form}
            intensity={former.intensity}
            color={former.color}
            position={former.position}
            scale={former.scale}
            rotation-x={former.rotationX ?? 0}
          />
        ))}
      </Environment>
    </>
  );
}
