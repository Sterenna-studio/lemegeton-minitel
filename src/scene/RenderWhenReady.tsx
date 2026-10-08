import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

// The canvases render on demand (frameloop "demand") : when the models of a
// Suspense boundary finish loading, nothing else asks for a frame, and the
// view stays black until the pointer moves. Placed last inside a boundary, this
// mounts once its siblings are ready and asks for two frames (the environment
// map renders on the first one).
export function RenderWhenReady({ onReady }: { onReady?: () => void } = {}) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
    onReady?.();
    const frame = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(frame);
  }, [invalidate, onReady]);
  return null;
}
