import { useEffect, useMemo, type DependencyList } from "react";

// GPU objects made by a room (materials, geometries, canvas textures) : built
// once, disposed with the room. Shared KTX2 maps are never disposed here.

type Disposable = { dispose: () => void };
const isDisposable = (value: unknown): value is Disposable =>
  typeof value === "object" && value !== null && typeof (value as Disposable).dispose === "function";

/** Disposes every value of the object (one level deep, arrays included). */
export function useOwned<T extends Record<string, unknown>>(build: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const owned = useMemo(build, deps);
  useEffect(
    () => () => {
      for (const value of Object.values(owned)) {
        if (Array.isArray(value)) value.forEach((item) => isDisposable(item) && item.dispose());
        else if (isDisposable(value)) value.dispose();
      }
    },
    [owned],
  );
  return owned;
}
