import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type { PointLight } from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

// A warm lamp far behind the terminal, slowly breathing like a filament or a
// flame. The scene renders on demand : the light asks for frames itself, at a
// modest rate, and stays still when the user prefers reduced motion.
function DistantLamp() {
  const light = useRef<PointLight>(null);
  const invalidate = useThree((state) => state.invalidate);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion) return;
    const start = performance.now();
    const timer = window.setInterval(() => {
      const t = (performance.now() - start) / 1000;
      const lamp = light.current;
      if (!lamp) return;
      const breath = 0.5 * Math.sin(t * 1.3) + 0.3 * Math.sin(t * 2.9 + 1.7) + 0.2 * Math.sin(t * 7.1);
      lamp.intensity = 150 * (1 + 0.28 * breath);
      lamp.position.x = -9 + 0.5 * Math.sin(t * 0.45);
      invalidate();
    }, 50);
    return () => window.clearInterval(timer);
  }, [reducedMotion, invalidate]);
  return <pointLight ref={light} position={[-9, 3.5, -9]} color="#ff9a4d" intensity={150} decay={2} />;
}

export function Lighting() {
  return (
    <>
      <hemisphereLight args={["#ffdcb2", "#1a120b", 1.25]} />
      <directionalLight
        position={[-4, 7, 5]}
        color="#ffcf98"
        intensity={2.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.001}
      />
      <directionalLight position={[5, 4, -4]} color="#e9d8c0" intensity={1.1} />
      <DistantLamp />
      {/* Weak, warm reflections : the finishes read as matte plastic. */}
      <Environment frames={1} resolution={128} environmentIntensity={0.4}>
        <Lightformer form="rect" intensity={1.6} color="#ffe2bd" position={[-3, 4, 4]} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#f2dcc0" position={[4, 3, -3]} scale={[4, 4, 1]} />
        <Lightformer form="ring" intensity={0.6} color="#d79a55" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={3} />
      </Environment>
    </>
  );
}
