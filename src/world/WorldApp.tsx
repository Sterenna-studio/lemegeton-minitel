import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState, type KeyboardEvent } from "react";
import { Canvas } from "@react-three/fiber";
import { ArrowLeft, DoorOpen, FileText, Footprints, Monitor, Volume2, VolumeX } from "lucide-react";
import { catalog } from "../demo/catalog";
import { Lighting, couloirInterieurLighting } from "../scene/Lighting";
import { supportsWebGL } from "../scene/Scene";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { setUrlParams } from "../hooks/urlParams";
import { buildWorld, findStation } from "./rooms";
import { areNeighbours, linksFrom, targetOf, type Link } from "./rails";
import { initialState, navigate, type NavEvent, type NavState } from "./navigation";
import { paramsForStation, stationFromParams } from "./url";
import { viewOf } from "./pose";
import { DoorSound } from "./doorSound";
import { Corridor } from "./three/Corridor";
import { NavCamera } from "./three/NavCamera";
import { RoomPlaceholder } from "./three/RoomPlaceholder";
import type { DoorSlot, World } from "./types";

// The explorable world on its rails (lot D, docs/MONDE_EXPLORABLE.md §4) :
// stations, travels, temporal doors, rooms (provisional until lot E), the
// address of the page and the browser history, keyboard, pointer and touch.

function labelOf(world: World, link: Link): string {
  if (link.kind === "porte") return `Ouvrir la porte ${link.door.door.year}`;
  if (link.kind === "sortie") return "Sortir vers le couloir";
  return `Aller : ${findStation(world, targetOf(world, link))?.label ?? ""}`;
}

export function WorldApp() {
  const world = useMemo(() => buildWorld(catalog), []);
  const reducedMotion = useReducedMotion();
  const options = useRef({ reducedMotion });
  options.current.reducedMotion = reducedMotion;
  const [state, dispatch] = useReducer(
    (current: NavState, event: NavEvent) => navigate(world, current, event, options.current),
    undefined,
    () => initialState(stationFromParams(world, new URLSearchParams(window.location.search))),
  );
  const [webgl] = useState(supportsWebGL);
  const [soundOn, setSoundOn] = useState(false);
  const sound = useMemo(() => new DoorSound(), []);
  useEffect(() => () => sound.dispose(), [sound]);
  const view = viewOf(world, state);
  const moving = state.mode !== "poste";

  // Time runs while moving.
  useEffect(() => {
    if (!moving) return;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      dispatch({ type: "AVANCER", dt: Math.min(0.1, (now - last) / 1000) });
      last = now;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [moving]);
  useEffect(() => {
    if (view.door) sound.update(view.door.state, true);
    else sound.idle();
  }, [sound, view.door]);

  // Address and history : one entry per station reached ; Back replays the way.
  const reached = state.mode === "poste" ? state.station : null;
  const fromHistory = useRef(false);
  const first = useRef(true);
  useEffect(() => {
    if (!reached) return;
    const params = paramsForStation(reached);
    if (first.current) setUrlParams(params, "replace");
    else if (!fromHistory.current) setUrlParams(params, "push");
    first.current = false;
    fromHistory.current = false;
  }, [reached]);
  const latest = useRef(state);
  latest.current = state;
  useEffect(() => {
    const pop = () => {
      const current = latest.current;
      if (current.mode !== "poste") return;
      const target = stationFromParams(world, new URLSearchParams(window.location.search));
      if (target === current.station) return;
      fromHistory.current = true;
      if (target === current.history[current.history.length - 1]) dispatch({ type: "PRECEDENT" });
      else if (areNeighbours(world, current.station, target)) dispatch({ type: "ALLER", to: target });
      else dispatch({ type: "SAUT", to: target });
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [world]);

  const links = reached ? linksFrom(world, reached) : [];
  const act = useCallback(
    (link: Link) => {
      if (link.kind === "porte") dispatch({ type: "PORTE" });
      else if (link.kind === "sortie") dispatch({ type: "SORTIE" });
      else dispatch({ type: "ALLER", to: link.to });
    },
    [],
  );
  // A click on a door : open it from its station, or walk up to it.
  const onDoor = useCallback(
    (slot: DoorSlot) => {
      const current = latest.current;
      if (current.mode !== "poste") return;
      if (current.station === slot.approach) dispatch({ type: "PORTE" });
      else if (areNeighbours(world, current.station, slot.approach)) dispatch({ type: "ALLER", to: slot.approach });
    },
    [world],
  );
  // Keyboard : arrows move between the actions, Escape goes back.
  const bar = useRef<HTMLDivElement>(null);
  function onKeyDown(event: KeyboardEvent) {
    const buttons = Array.from(bar.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (step && buttons.length) {
      event.preventDefault();
      buttons[(index + step + buttons.length) % buttons.length].focus();
    }
  }
  useEffect(() => {
    const key = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" || (event.key === "Backspace" && !(event.target instanceof HTMLInputElement))) {
        event.preventDefault();
        dispatch({ type: "PRECEDENT" });
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const station = reached ? findStation(world, reached) : undefined;
  const room = world.rooms.find((r) => r.id === view.place);
  const announce = station ? `${station.label}. ${links.length} déplacement${links.length > 1 ? "s" : ""} possible${links.length > 1 ? "s" : ""}.` : "";
  const base = import.meta.env.BASE_URL;

  return (
    <main className="world">
      <header className="world-masthead">
        <a className="world-brand" href={`${base}parcours/`}>
          <Monitor size={22} />
          <span>
            Minitel<small>parcours · aperçu</small>
          </span>
        </a>
        <nav aria-label="Autres pages">
          <a href={`${base}simple/`}>Version simple</a>
          <a href={`${base}atelier/`}>Atelier</a>
          <a href={`${base}documentation/`}>
            <FileText size={14} /> Documentation
          </a>
          <button
            type="button"
            aria-pressed={soundOn}
            onClick={() => {
              sound.setEnabled(!soundOn);
              setSoundOn(!soundOn);
            }}
          >
            {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />} Son {soundOn ? "activé" : "coupé"}
          </button>
        </nav>
      </header>
      {webgl ? (
        <div className="world-stage" data-testid="monde">
          <Canvas
            frameloop="demand"
            dpr={[1, 1.5]}
            camera={{ fov: view.fov, near: 0.1, far: 400, position: view.position }}
            gl={{ antialias: true, preserveDrawingBuffer: import.meta.env.DEV }}
            aria-label={`Vue 3D : ${station?.label ?? "en déplacement"}`}
          >
            <color attach="background" args={["#0c0b0a"]} />
            <fog attach="fog" args={["#0c0b0a", 70, 190]} />
            <Suspense fallback={null}>
              {view.place === "couloir" ? (
                <>
                  <Lighting preset={couloirInterieurLighting} />
                  <Corridor
                    data={world.corridor}
                    doorStates={view.door ? { [view.door.id]: view.door.state } : {}}
                    clockSpeed={view.door?.state.clockSpeed ?? 1}
                    onDoor={onDoor}
                  />
                </>
              ) : (
                room && <RoomPlaceholder room={room} />
              )}
            </Suspense>
            <NavCamera view={view} parallax={!moving && !reducedMotion} />
          </Canvas>
          <div className="world-fade" style={{ opacity: view.fade }} aria-hidden="true" />
        </div>
      ) : (
        <p className="world-fallback" role="status">
          WebGL indisponible : la <a href={`${base}simple/`}>version simple</a> reste consultable.
        </p>
      )}
      <div className="world-actions" ref={bar} role="toolbar" aria-label="Déplacements" onKeyDown={onKeyDown}>
        {state.history.length > 0 && (
          <button type="button" disabled={moving} onClick={() => dispatch({ type: "PRECEDENT" })}>
            <ArrowLeft size={16} /> Revenir
          </button>
        )}
        {links.map((link) => (
          <button key={`${link.kind}-${targetOf(world, link)}`} type="button" disabled={moving} onClick={() => act(link)}>
            {link.kind === "aller" ? <Footprints size={16} /> : <DoorOpen size={16} />} {labelOf(world, link)}
          </button>
        ))}
        {moving && <span className="world-moving">En déplacement…</span>}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
    </main>
  );
}
