import { useEffect, useRef, type ComponentRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Vec3 } from "../minitel/types";
import { viewPosition, type Framing } from "./framing";
export interface CameraCommand {
  id: number;
  kind: "reset" | "front" | "side" | "back" | "zoomIn" | "zoomOut";
}
export function Camera({
  command,
  framing,
  target,
  onCamera,
}: {
  command: CameraCommand;
  framing: Framing;
  /** Centre of the terminal screen : every view aims at it. */
  target: Vec3;
  onCamera?: (position: Vec3) => void;
}) {
  const ref = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, size, invalidate } = useThree();
  const narrow = size.width / size.height < 1.2;
  const [tx, ty, tz] = target;
  useEffect(() => {
    const aim: Vec3 = [tx, ty, tz];
    camera.position.set(...viewPosition(aim, narrow ? framing.reset.narrow : framing.reset.wide));
    ref.current?.target.set(...aim);
    ref.current?.update();
    invalidate();
  }, [narrow, framing, tx, ty, tz, camera, invalidate]);
  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    const aim: Vec3 = [tx, ty, tz];
    controls.target.set(...aim);
    if (command.kind === "zoomIn" || command.kind === "zoomOut") {
      const vector = camera.position.clone().sub(controls.target);
      const distance = Math.max(
        framing.minDistance,
        Math.min(
          framing.maxDistance,
          vector.length() * (command.kind === "zoomIn" ? 0.85 : 1.15),
        ),
      );
      camera.position.copy(controls.target).add(vector.setLength(distance));
    } else
      camera.position.set(...viewPosition(aim, framing[command.kind][narrow ? "narrow" : "wide"]));
    controls.update();
    invalidate();
  }, [command, camera, invalidate, narrow, framing, tx, ty, tz]);
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enablePan={false}
      enableDamping={false}
      minDistance={framing.minDistance}
      maxDistance={framing.maxDistance}
      minPolarAngle={0.32}
      maxPolarAngle={Math.PI / 2 - 0.03}
      target={target}
      onChange={() => onCamera?.(camera.position.toArray() as Vec3)}
    />
  );
}
