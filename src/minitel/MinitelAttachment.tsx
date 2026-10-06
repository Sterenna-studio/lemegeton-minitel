import { createContext, useContext, type ReactNode } from "react";
import type { Anchor, Vec3 } from "./types";
export const AnchorContext = createContext<Record<string, Anchor>>({});
export function MinitelAttachment({
  anchor,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  children,
}: {
  anchor: string;
  position?: Vec3;
  rotation?: Vec3;
  children: ReactNode;
}) {
  const anchors = useContext(AnchorContext);
  const point = anchors[anchor];
  if (!point) throw new Error(`Anchor inconnu: ${anchor}`);
  return (
    <group position={point.position} rotation={point.rotation}>
      <group position={position} rotation={rotation}>
        {children}
      </group>
    </group>
  );
}
