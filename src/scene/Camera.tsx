import { useEffect, useRef, type ComponentRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Vec3 } from "../minitel/types";
export interface CameraCommand {
  id: number;
  kind: "reset" | "front" | "side" | "back" | "zoomIn" | "zoomOut";
}
export function Camera({
  command,
  onCamera,
}: {
  command: CameraCommand;
  onCamera?: (position: Vec3) => void;
}) {
  const ref = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const narrow = size.width / size.height < 1.2;
    camera.position.set(
      narrow ? 2.5 : 4.0,
      narrow ? 3.5 : 3.2,
      narrow ? 10.5 : 7.3,
    );
    ref.current?.target.set(0, 1, 0.3);
    ref.current?.update();
    invalidate();
  }, [size.width, size.height, camera, invalidate]);
  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    const narrow = size.width / size.height < 1.2;
    if (command.kind === "front")
      camera.position.set(0, 2.5, narrow ? 9.5 : 7.3);
    else if (command.kind === "side")
      camera.position.set(narrow ? 9.5 : 7.3, 2.5, 0.3);
    else if (command.kind === "back")
      camera.position.set(0, 2.5, narrow ? -9.5 : -7.3);
    else if (command.kind === "reset")
      camera.position.set(
        narrow ? 2.5 : 4,
        narrow ? 3.5 : 3.2,
        narrow ? 10.5 : 7.3,
      );
    else {
      const vector = camera.position.clone().sub(controls.target);
      const distance = Math.max(
        3.8,
        Math.min(
          11,
          vector.length() * (command.kind === "zoomIn" ? 0.85 : 1.15),
        ),
      );
      camera.position.copy(controls.target).add(vector.setLength(distance));
    }
    controls.update();
    invalidate();
  }, [command, camera, invalidate, size.width, size.height]);
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enablePan={false}
      enableDamping={false}
      minDistance={3.8}
      maxDistance={11}
      minPolarAngle={0.32}
      maxPolarAngle={Math.PI / 2 - 0.03}
      target={[0, 1, 0.3]}
      onChange={() => onCamera?.(camera.position.toArray() as Vec3)}
    />
  );
}
