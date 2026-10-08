import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { createLemegetonTerminal } from "../demo/LemegetonTerminal";
import { useMinitel } from "../hooks/useMinitel";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { setUrlParam, urlParam } from "../hooks/urlParams";
import { defaultEffects, type CrtEffects } from "../videotex/renderer";
import {
  EYE_PALETTES,
  EYE_RENDERS,
  EYE_STYLES,
  EyesController,
  type EyePaletteId,
  type EyeRenderId,
  type EyeStyleId,
} from "../eyes/EyesController";
import { SmoothEyes } from "../eyes/SmoothEyes";
import type { ScreenSource } from "../minitel/types";

export type ScreenMode = "3615" | "yeux";

/**
 * Everything the terminal screen needs : the 3615 Lemegeton service, the eyes
 * (mosaic or classic), CRT effects and key routing. Shared by the simple
 * version (App) and, later, the terminal station of each room.
 */
export function useTerminalExperience() {
  const terminal = useMemo(createLemegetonTerminal, []);
  const snapshot = useMinitel(terminal);
  // ?ecran=yeux shows Lemegeton's eyes (Videotex mosaic, ported from
  // minitel-face LibEyes) instead of the 3615 pages ; ?couleur= picks a palette.
  const [screenMode, setScreenMode] = useState<ScreenMode>(() =>
    urlParam("ecran") === "yeux" ? "yeux" : "3615",
  );
  const eyes = useMemo(() => {
    const palette = EYE_PALETTES.find((p) => p.id === urlParam("couleur"))?.id ?? "cyan";
    const style = EYE_STYLES.find((s) => s.id === urlParam("yeux"))?.id ?? "zyra";
    const scale = Number(urlParam("taille") ?? 1);
    const render = EYE_RENDERS.find((r) => r.id === urlParam("rendu"))?.id ?? "mosaique";
    return new EyesController({ palette, style, scale, render });
  }, []);
  const eyesSnapshot = useSyncExternalStore(eyes.subscribe, eyes.getSnapshot);
  const activeFrame = screenMode === "yeux" ? eyesSnapshot.frame : snapshot.frame;
  // Classic (smooth) eyes draw into their own canvas, uploaded continuously.
  const smoothEyes = useMemo(() => new SmoothEyes(eyes), [eyes]);
  const smoothActive = screenMode === "yeux" && eyesSnapshot.render === "classique";
  const [effects, setEffects] = useState<CrtEffects>(defaultEffects);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    smoothEyes.setOptions({ effects, reducedMotion, scale: eyesSnapshot.scale });
  }, [smoothEyes, effects, reducedMotion, eyesSnapshot.scale]);
  useEffect(() => {
    if (!smoothActive) return;
    smoothEyes.start();
    return () => smoothEyes.stop();
  }, [smoothEyes, smoothActive]);
  useEffect(() => {
    // Autonomous blinking, gaze and reactions only while the eyes are shown,
    // and never when the user prefers reduced motion. Same for the light gaze
    // towards the mouse (not touch : a finger is on the screen, not beside it).
    if (screenMode !== "yeux" || reducedMotion) return;
    eyes.start();
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      eyes.follow((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      eyes.stop();
    };
  }, [eyes, screenMode, reducedMotion]);
  const chooseScreen = useCallback((mode: ScreenMode) => {
    setScreenMode(mode);
    setUrlParam("ecran", mode === "yeux" ? "yeux" : null);
  }, []);
  const choosePalette = useCallback(
    (palette: EyePaletteId) => {
      eyes.setPalette(palette);
      setUrlParam("couleur", palette);
    },
    [eyes],
  );
  const chooseStyle = useCallback(
    (style: EyeStyleId) => {
      eyes.setStyle(style);
      setUrlParam("yeux", style);
    },
    [eyes],
  );
  const chooseRender = useCallback(
    (render: EyeRenderId) => {
      eyes.setRender(render);
      setUrlParam("rendu", render === "mosaique" ? null : render);
    },
    [eyes],
  );
  const chooseScale = useCallback(
    (scale: number) => {
      eyes.setScale(scale);
      const applied = eyes.getSnapshot().scale;
      setUrlParam("taille", applied === 1 ? null : String(applied));
    },
    [eyes],
  );
  // Keys go to the active screen ; Connexion/Fin leaves the eyes for 3615.
  const sendKey = useCallback(
    (key: string) => {
      if (screenMode !== "yeux") return terminal.sendKey(key);
      if (key === "ConnexionFin") chooseScreen("3615");
      else eyes.key(key);
    },
    [screenMode, terminal, eyes, chooseScreen],
  );
  const goTo = useCallback(
    (page: string) => {
      chooseScreen("3615");
      terminal.go(page);
    },
    [chooseScreen, terminal],
  );
  const source: ScreenSource = useMemo(
    () =>
      smoothActive
        ? {
            kind: "canvas",
            canvas: smoothEyes.canvas,
            revision: 0,
            continuous: true,
            accessibleText: `Yeux de Lemegeton, humeur : ${eyesSnapshot.moodLabel.toLowerCase()}`,
          }
        : { kind: "videotex", frame: activeFrame },
    [smoothActive, smoothEyes, eyesSnapshot.moodLabel, activeFrame],
  );
  return {
    activeFrame,
    screenMode,
    chooseScreen,
    eyesSnapshot,
    choosePalette,
    chooseStyle,
    chooseRender,
    chooseScale,
    effects,
    setEffects,
    reducedMotion,
    sendKey,
    goTo,
    source,
  };
}

export type TerminalExperience = ReturnType<typeof useTerminalExperience>;

/** Physical keyboard -> terminal, unless the focus is in a form control. */
export function useTerminalKeyboard(sendKey: (key: string) => void) {
  useEffect(() => {
    function key(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          /INPUT|TEXTAREA|SELECT|BUTTON/.test(target.tagName))
      )
        return;
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (
        event.key.length === 1 ||
        ["Enter", "Escape", "Backspace", "Delete", "Home"].includes(event.key)
      ) {
        event.preventDefault();
        sendKey(event.key);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [sendKey]);
}
