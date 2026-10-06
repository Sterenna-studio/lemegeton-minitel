import { Component, useEffect, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Minitel, type MinitelProps } from "../minitel/Minitel";
import { Lighting } from "./Lighting";
import { Camera, type CameraCommand } from "./Camera";
import type { Vec3 } from "../minitel/types";
function Metrics({
  onMetrics,
}: {
  onMetrics?: (fps: number, drawCalls: number) => void;
}) {
  const gl = useThree((state) => state.gl);
  const state = useRef({ time: 0, frames: 0 });
  useFrame(({ clock }) => {
    state.current.frames++;
    const t = clock.elapsedTime;
    if (t - state.current.time >= 1) {
      onMetrics?.(
        Math.round(state.current.frames / (t - state.current.time)),
        gl.info.render.calls,
      );
      state.current = { time: t, frames: 0 };
    }
  });
  return null;
}
class SceneBoundary extends Component<
  { children: ReactNode; onError: (message: string) => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error.message);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
function ContextMonitor({ onError }: { onError: (message: string) => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (e: Event) => {
      e.preventDefault();
      onError(
        "Le contexte WebGL a ete perdu. Le terminal texte reste disponible.",
      );
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onError]);
  return null;
}
export function Scene({
  command,
  onError,
  onCamera,
  onMetrics,
  ...props
}: MinitelProps & {
  command: CameraCommand;
  onError: (message: string) => void;
  onCamera?: (position: Vec3) => void;
  onMetrics?: (fps: number, calls: number) => void;
}) {
  return (
    <SceneBoundary onError={onError}>
      <Canvas
        shadows
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ fov: 40, near: 0.1, far: 80, position: [4, 3.2, 6.4] }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: import.meta.env.DEV,
        }}
        aria-label="Minitel 3D interactif"
      >
        <color attach="background" args={["#e4e8e7"]} />
        <fog attach="fog" args={["#e4e8e7", 15, 35]} />
        <Lighting />
        <Camera command={command} onCamera={onCamera} />
        <ContextMonitor onError={onError} />
        <Minitel {...props} />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.02, 0]}
          receiveShadow
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#e4e8e7" roughness={1} />
        </mesh>
        {import.meta.env.DEV && onMetrics && <Metrics onMetrics={onMetrics} />}
      </Canvas>
    </SceneBoundary>
  );
}
