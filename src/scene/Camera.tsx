import { useEffect, useRef, type ComponentRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Vec3 } from "../minitel/types";
import type { Framing } from "./framing";
export interface CameraCommand {
  id: number;
  kind: "reset" | "front" | "side" | "back" | "zoomIn" | "zoomOut";
}
export function Camera({
  command,
  framing,
  onCamera,
}: {
  command: CameraCommand;
  framing: Framing;
  onCamera?: (position: Vec3) => void;
}) {
  const ref = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, size, invalidate } = useThree();
  const narrow = size.width / size.height < 1.2;
  useEffect(() => {
    camera.position.set(...(narrow ? framing.reset.narrow : framing.reset.wide));
    ref.current?.target.set(...framing.target);
    ref.current?.update();
    invalidate();
  }, [narrow, framing, camera, invalidate]);
  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    const view = narrow ? "narrow" : "wide";
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
    } else camera.position.set(...framing[command.kind][view]);
    controls.update();
    invalidate();
  }, [command, camera, invalidate, narrow, framing]);
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
      target={framing.target}
      onChange={() => onCamera?.(camera.position.toArray() as Vec3)}
    />
  );
}
