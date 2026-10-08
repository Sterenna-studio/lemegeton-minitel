import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Vector3 } from "three";
import { fittedFov, type View } from "../pose";

// Camera of the world : it shows the View computed for the navigation state
// (src/world/pose.ts). At rest, a small parallax follows the pointer (±3° in
// yaw, ±2° in pitch, docs/MONDE_EXPLORABLE.md §4) ; none with reduced motion.
// On a phone held upright, the fov widens to keep the width of the view.

const YAW = (3 * Math.PI) / 180;
const PITCH = (2 * Math.PI) / 180;

export function NavCamera({ view, parallax }: { view: View; parallax: boolean }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const invalidate = useThree((state) => state.invalidate);
  const aspect = useThree((state) => state.size.width / state.size.height);
  const pointer = useRef({ x: 0, y: 0 });
  const offset = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (!parallax) {
      pointer.current = { x: 0, y: 0 };
      return;
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer.current = { x: (event.clientX / window.innerWidth) * 2 - 1, y: (event.clientY / window.innerHeight) * 2 - 1 };
      invalidate();
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [parallax, invalidate]);
  useEffect(() => invalidate(), [view, aspect, invalidate]);
  useFrame(() => {
    const target = parallax ? pointer.current : { x: 0, y: 0 };
    offset.current.x += (target.x - offset.current.x) * 0.12;
    offset.current.y += (target.y - offset.current.y) * 0.12;
    camera.position.set(...view.position);
    const fov = fittedFov(view.fov, aspect, view.fit);
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    // Aim, turned a little around the camera by the parallax.
    const aim = new Vector3(...view.lookAt).sub(camera.position);
    aim.applyAxisAngle(new Vector3(0, 1, 0), -offset.current.x * YAW);
    const side = new Vector3().crossVectors(aim, new Vector3(0, 1, 0)).normalize();
    aim.applyAxisAngle(side, -offset.current.y * PITCH);
    camera.lookAt(camera.position.clone().add(aim));
    // Keep easing towards the pointer.
    if (Math.abs(target.x - offset.current.x) + Math.abs(target.y - offset.current.y) > 0.002) invalidate();
  });
  return null;
}
