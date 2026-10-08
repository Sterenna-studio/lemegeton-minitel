import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { DoorOpen, MapPin } from "lucide-react";
import { catalog } from "../demo/catalog";
import { Lighting, couloirInterieurLighting } from "../scene/Lighting";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { setUrlParam, urlParam } from "../hooks/urlParams";
import { buildWorld } from "../world/rooms";
import { linksFrom } from "../world/rails";
import { SEQUENCE_DURATION, doorSequence, type DoorState } from "../world/sequence";
import { Corridor } from "../world/three/Corridor";
import { RailCamera } from "../world/three/RailCamera";
import type { Station } from "../world/types";

// Workshop of the corridor (lot C, docs/MONDE_EXPLORABLE.md §4 and §9) : the
// corridor kit with its three doors in chronological order and the clock, the
// rail camera going from station to station, a door opening at its approach
// station, and the rendering cost (draw calls, triangles) against the budget.

/** Reports the renderer's cost about once a second. */
function Stats({ onStats }: { onStats: (calls: number, triangles: number) => void }) {
  const gl = useThree((state) => state.gl);
  const last = useRef(0);
  useFrame(({ clock }) => {
    if (clock.elapsedTime - last.current < 1) return;
    last.current = clock.elapsedTime;
    onStats(gl.info.render.calls, gl.info.render.triangles);
  });
  return null;
}

export function CorridorWorkshop() {
  const world = useMemo(() => buildWorld(catalog), []);
  const stations = world.corridor.stations;
  const [station, setStation] = useState<Station>(
    () => stations.find((s) => s.id === `couloir:${urlParam("poste")}`) ?? stations[0],
  );
  const [arrived, setArrived] = useState<string>(station.id);
  const [opening, setOpening] = useState<{ door: string; t: number } | null>(null);
  const [stats, setStats] = useState({ calls: 0, triangles: 0 });
  const reducedMotion = useReducedMotion();
  const door = linksFrom(world, station.id).find((link) => link.kind === "porte");
  const slot = door?.kind === "porte" ? door.door : undefined;

  // Door sequence at its station : t runs to the end, then the door stays open.
  useEffect(() => {
    if (!opening || opening.t >= SEQUENCE_DURATION) return;
    const frame = requestAnimationFrame(() =>
      setOpening((current) => (current ? { ...current, t: Math.min(SEQUENCE_DURATION, current.t + 1 / 60) } : current)),
    );
    return () => cancelAnimationFrame(frame);
  }, [opening]);
  const doorStates: Record<string, DoorState> = {};
  if (opening) {
    const target = world.corridor.doors.find((d) => d.door.id === opening.door);
    if (target) doorStates[opening.door] = doorSequence(opening.t, world.corridor.year, target.door.year);
  }
  const clockSpeed = Object.values(doorStates)[0]?.clockSpeed ?? 1;

  function go(next: Station) {
    setOpening(null);
    setStation(next);
    setUrlParam("poste", next.id === stations[0].id ? null : next.id.split(":")[1]);
  }
  function openDoor() {
    if (!slot) return;
    setOpening({ door: slot.door.id, t: reducedMotion ? SEQUENCE_DURATION : 0 });
  }
  const moving = arrived !== station.id;

  return (
    <section className="door-workshop corridor-workshop" aria-label="Atelier du couloir">
      <div className="door-stage">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ fov: station.fov ?? 60, near: 0.1, far: 400, position: station.position }}
          gl={{ antialias: true, preserveDrawingBuffer: import.meta.env.DEV }}
          aria-label={`Couloir, ${station.label}, vue 3D`}
        >
          <color attach="background" args={["#0c0b0a"]} />
          <fog attach="fog" args={["#0c0b0a", 70, 190]} />
          <Lighting preset={couloirInterieurLighting} />
          <Suspense fallback={null}>
            <Corridor data={world.corridor} doorStates={doorStates} clockSpeed={clockSpeed} />
          </Suspense>
          <RailCamera station={station} reducedMotion={reducedMotion} onArrive={(s) => setArrived(s.id)} />
          <Stats onStats={(calls, triangles) => setStats({ calls, triangles })} />
        </Canvas>
      </div>
      <div className="door-controls">
        <nav className="corridor-stations" aria-label="Postes du couloir">
          {stations.map((s) => (
            <button key={s.id} type="button" onClick={() => go(s)} aria-current={s.id === station.id ? "true" : undefined}>
              <MapPin size={15} /> {s.label}
            </button>
          ))}
        </nav>
        {slot && (
          <div className="door-buttons">
            <button type="button" onClick={openDoor} disabled={moving || !!opening}>
              <DoorOpen size={16} /> Ouvrir la porte {slot.door.year}
            </button>
          </div>
        )}
        <dl className="door-state" data-testid="etat-couloir">
          <div>
            <dt>Poste</dt>
            <dd>{moving ? "en route" : station.label}</dd>
          </div>
          <div>
            <dt>Porte</dt>
            <dd>{opening ? `${Math.round((doorStates[opening.door]?.leaf ?? 0) * 100)} %` : "fermée"}</dd>
          </div>
          <div>
            <dt>Appels</dt>
            <dd>{stats.calls}</dd>
          </div>
          <div>
            <dt>Triangles</dt>
            <dd>{stats.triangles.toLocaleString("fr")}</dd>
          </div>
        </dl>
        <p className="sr-only" role="status">
          {moving ? "" : `Arrivé : ${station.label}.`}
        </p>
        <p className="door-credits">
          Textures : Poly Haven, CC0 (lambris, papier peint, parquet) · Porte : Mehdi Shahsavan, CC BY 4.0 · Horloges :
          Poly Haven, CC0.
        </p>
      </div>
    </section>
  );
}
