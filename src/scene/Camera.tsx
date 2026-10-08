import { useEffect, useRef, useState, type ComponentRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { PerspectiveCamera, Vector3 } from "three";
import type { ScreenFocus, Vec3 } from "../minitel/types";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { easeInOutCubic } from "../world/rails";
import { focusPosition, viewPosition, type Framing } from "./framing";
export interface CameraCommand {
  id: number;
  kind: "reset" | "front" | "side" | "back" | "zoomIn" | "zoomOut" | "focus" | "unfocus";
  /** Screen to frame, for "focus". */
  screen?: ScreenFocus;
}
/** Duration of the move into and out of the focus view, in ms. */
const FOCUS_MOVE = 700;
/** Closest distance while focused : the focus view may sit inside minDistance. */
const FOCUS_MIN_DISTANCE = 0.3;
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
  const reducedMotion = useReducedMotion();
  const narrow = size.width / size.height < 1.2;
  const [tx, ty, tz] = target;
  // Smooth move (focus in and out), and the position to come back to.
  const tween = useRef<{ from: Vector3; to: Vector3; start: number } | null>(null);
  const saved = useRef<Vector3 | null>(null);
  const [moving, setMoving] = useState(false);
  // Focused on the screen : the view is locked (no orbit, no wheel zoom).
  const locked = command.kind === "focus";
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
    const moveTo = (to: Vector3) => {
      if (reducedMotion) {
        camera.position.copy(to);
        controls.update();
      } else {
        tween.current = { from: camera.position.clone(), to, start: performance.now() };
        setMoving(true);
      }
      invalidate();
    };
    if (command.kind === "focus" && command.screen) {
      // Keep the first position only : a resize re-runs this effect.
      saved.current ??= camera.position.clone();
      const fov = camera instanceof PerspectiveCamera ? camera.fov : 40;
      moveTo(new Vector3(...focusPosition(aim, command.screen, fov, size.width / size.height)));
      return;
    }
    if (command.kind === "unfocus") {
      const back = saved.current ?? new Vector3(...viewPosition(aim, framing.reset[narrow ? "narrow" : "wide"]));
      saved.current = null;
      moveTo(back);
      return;
    }
    saved.current = null;
    tween.current = null;
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
    } else {
      // A focus command without a screen falls back to the default view.
      const view = command.kind === "focus" ? "reset" : command.kind;
      camera.position.set(...viewPosition(aim, framing[view][narrow ? "narrow" : "wide"]));
    }
    controls.update();
    invalidate();
  }, [command, camera, invalidate, narrow, framing, tx, ty, tz, size.width, size.height, reducedMotion]);
  useFrame(() => {
    const move = tween.current;
    if (!move) return;
    const k = easeInOutCubic((performance.now() - move.start) / FOCUS_MOVE);
    camera.position.lerpVectors(move.from, move.to, k);
    ref.current?.update();
    if (k >= 1) {
      tween.current = null;
      setMoving(false);
      onCamera?.(camera.position.toArray() as Vec3);
    }
    invalidate();
  });
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enablePan={false}
      enableDamping={false}
      enableRotate={!locked}
      enableZoom={!locked}
      minDistance={locked || moving ? FOCUS_MIN_DISTANCE : framing.minDistance}
      maxDistance={framing.maxDistance}
      minPolarAngle={0.32}
      maxPolarAngle={Math.PI / 2 - 0.03}
      target={target}
      onChange={() => onCamera?.(camera.position.toArray() as Vec3)}
    />
  );
}
