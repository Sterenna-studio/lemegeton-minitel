import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { DoorClosed, DoorOpen, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { catalog } from "../demo/catalog";
import { Lighting, couloirLighting } from "../scene/Lighting";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { setUrlParam, urlParam } from "../hooks/urlParams";
import { buildWorld } from "../world/rooms";
import { SEQUENCE_DURATION, counterText, doorSequence } from "../world/sequence";
import { DoorSound } from "../world/doorSound";
import { TemporalDoor } from "../world/three/TemporalDoor";
import { GrandfatherClock } from "../world/three/GrandfatherClock";

// Workshop of the temporal door (lot B, docs/MONDE_EXPLORABLE.md §5 and §9) :
// the door alone, in the corridor's light, with the grandfather clock whose
// hands race. Play the sequence, scrub it, pick the year, turn the sound on.

const percent = (x: number) => `${Math.round(x * 100)} %`;
const seconds = (t: number) => `${t.toLocaleString("fr", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;

export function DoorWorkshop() {
  const world = useMemo(() => buildWorld(catalog), []);
  const doors = world.corridor.doors;
  const [slot, setSlot] = useState(() => {
    const room = urlParam("porte");
    return doors.find((d) => d.to.kind === "salle" && d.to.room === room) ?? doors[0];
  });
  const [t, setT] = useState(0);
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);
  const [soundOn, setSoundOn] = useState(false);
  const [announce, setAnnounce] = useState("");
  const reducedMotion = useReducedMotion();
  const sound = useMemo(() => new DoorSound(), []);
  useEffect(() => () => sound.dispose(), [sound]);
  const state = doorSequence(t, world.corridor.year, slot.door.year);

  // Playback : t follows the clock while playing, in either direction.
  useEffect(() => {
    if (!direction) return;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setT((current) => Math.min(SEQUENCE_DURATION, Math.max(0, current + direction * dt)));
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [direction]);
  useEffect(() => {
    if (direction === 1 && t >= SEQUENCE_DURATION) {
      setDirection(0);
      setAnnounce(`Porte ${slot.door.year} ouverte.`);
    } else if (direction === -1 && t <= 0) {
      setDirection(0);
      setAnnounce(`Porte ${slot.door.year} fermée.`);
    }
  }, [t, direction, slot.door.year]);
  useEffect(() => sound.update(state, direction !== 0), [sound, state, direction]);

  function open() {
    // Reduced motion : no animation, the door is open at once.
    if (reducedMotion) {
      setT(SEQUENCE_DURATION);
      setAnnounce(`Porte ${slot.door.year} ouverte.`);
      return;
    }
    if (t >= SEQUENCE_DURATION) setT(0);
    setDirection(1);
  }
  function close() {
    if (reducedMotion) {
      setT(0);
      setAnnounce(`Porte ${slot.door.year} fermée.`);
      return;
    }
    setDirection(-1);
  }
  function choose(room: string) {
    const next = doors.find((d) => d.to.kind === "salle" && d.to.room === room);
    if (!next) return;
    setSlot(next);
    setDirection(0);
    setT(0);
    setUrlParam("porte", room);
  }
  function toggleSound() {
    sound.setEnabled(!soundOn);
    setSoundOn(!soundOn);
  }

  return (
    <section className="door-workshop" aria-label="Atelier de la porte temporelle">
      <div className="door-stage">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ fov: 40, near: 0.1, far: 400, position: [16, 12, 34] }}
          gl={{ antialias: true, preserveDrawingBuffer: import.meta.env.DEV }}
          aria-label={`Porte temporelle ${slot.door.year}, vue 3D`}
        >
          <color attach="background" args={["#0c0b0a"]} />
          <fog attach="fog" args={["#0c0b0a", 50, 140]} />
          <Lighting preset={couloirLighting} />
          <Suspense fallback={null}>
            <TemporalDoor door={slot.door} state={state} />
            <GrandfatherClock speed={state.clockSpeed} position={[-13, 0, 2.5]} />
          </Suspense>
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[80, 60]} />
            <meshStandardMaterial color="#5c4330" roughness={0.85} />
          </mesh>
          <OrbitControls makeDefault target={[0, 10, 0]} enablePan={false} minDistance={10} maxDistance={70} maxPolarAngle={Math.PI / 2 - 0.05} />
        </Canvas>
      </div>
      <div className="door-controls">
        <label className="door-field">
          <span>Porte</span>
          <select value={slot.to.kind === "salle" ? slot.to.room : ""} onChange={(e) => choose(e.target.value)}>
            {doors.map((d) => (
              <option key={d.door.id} value={d.to.kind === "salle" ? d.to.room : d.door.id}>
                {d.door.year} · {d.door.plaque}
              </option>
            ))}
          </select>
        </label>
        <div className="door-buttons">
          <button type="button" onClick={open} disabled={direction === 1}>
            <DoorOpen size={16} /> Ouvrir
          </button>
          <button type="button" onClick={close} disabled={direction === -1 || t === 0}>
            <DoorClosed size={16} /> Refermer
          </button>
          <button
            type="button"
            onClick={() => {
              setDirection(0);
              setT(0);
            }}
          >
            <RotateCcw size={16} /> Remettre à zéro
          </button>
          <button type="button" onClick={toggleSound} aria-pressed={soundOn}>
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />} Son {soundOn ? "activé" : "coupé"}
          </button>
        </div>
        <label className="door-field">
          <span>Temps de la séquence : {seconds(t)}</span>
          <input
            type="range"
            min={0}
            max={SEQUENCE_DURATION}
            step={0.05}
            value={t}
            aria-valuetext={seconds(t)}
            onChange={(e) => {
              setDirection(0);
              setT(Number(e.target.value));
            }}
          />
        </label>
        <dl className="door-state" data-testid="etat-porte">
          <div>
            <dt>Compteur</dt>
            <dd>{counterText(state.counter)}</dd>
          </div>
          <div>
            <dt>Battant</dt>
            <dd>{percent(state.leaf)}</dd>
          </div>
          <div>
            <dt>Lumière</dt>
            <dd>{percent(state.glow)}</dd>
          </div>
          <div>
            <dt>Horloge</dt>
            <dd>×{Math.round(state.clockSpeed).toLocaleString("fr")}</dd>
          </div>
        </dl>
        <p className="visually-hidden" role="status">
          {announce}
        </p>
        <p className="door-credits">
          Porte : « Door_Wooden_Old », Mehdi Shahsavan, CC BY 4.0 · Pendule et grande horloge : Poly Haven, CC0 · Modèles
          provisoires.
        </p>
      </div>
    </section>
  );
}
