import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CatmullRomCurve3, PerspectiveCamera, Vector3 } from "three";
import { easeInOutCubic, travelDuration, travelPath } from "../rails";
import type { Station } from "../types";

// Camera on the rails (docs/MONDE_EXPLORABLE.md, §4) : it rests at a station
// and travels to the next along a curve, with a smooth start and stop, while
// its aim and field of view blend from one station to the other. With reduced
// motion it jumps. Used by the corridor workshop, then by the world (lot D).

const DEFAULT_FOV = 40;

export function RailCamera({
  station,
  reducedMotion,
  onArrive,
}: {
  station: Station;
  reducedMotion: boolean;
  /** Called once the camera stands at the station. */
  onArrive?: (station: Station) => void;
}) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const aim = useRef(new Vector3(...station.lookAt));
  const from = useRef<Station | null>(null);
  const travel = useRef<{ curve: CatmullRomCurve3; from: Station; to: Station; start: number; duration: number } | null>(null);
  const arrive = useRef(onArrive);
  arrive.current = onArrive;

  useEffect(() => {
    const previous = from.current;
    from.current = station;
    if (!previous || reducedMotion || previous.id === station.id) {
      travel.current = null;
      camera.position.set(...station.position);
      aim.current.set(...station.lookAt);
      camera.fov = station.fov ?? DEFAULT_FOV;
      camera.updateProjectionMatrix();
      camera.lookAt(aim.current);
      arrive.current?.(station);
      return;
    }
    // Leave from where the camera is (it may be mid-travel).
    const start: Station = { ...previous, position: camera.position.toArray() as Station["position"], lookAt: aim.current.toArray() as Station["lookAt"], fov: camera.fov };
    travel.current = {
      curve: new CatmullRomCurve3(travelPath(start, station).map((p) => new Vector3(...p))),
      from: start,
      to: station,
      start: performance.now(),
      duration: travelDuration(start, station) * 1000,
    };
  }, [station, reducedMotion, camera]);

  useFrame(() => {
    const move = travel.current;
    if (!move) return;
    const k = easeInOutCubic((performance.now() - move.start) / move.duration);
    move.curve.getPoint(k, camera.position);
    aim.current.set(...move.from.lookAt).lerp(new Vector3(...move.to.lookAt), k);
    camera.fov = (move.from.fov ?? DEFAULT_FOV) + ((move.to.fov ?? DEFAULT_FOV) - (move.from.fov ?? DEFAULT_FOV)) * k;
    camera.updateProjectionMatrix();
    camera.lookAt(aim.current);
    if (k >= 1) {
      travel.current = null;
      arrive.current?.(move.to);
    }
  });
  return null;
}
