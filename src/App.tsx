import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  BookOpen,
  Box,
  Cable,
  Crosshair,
  FileText,
  Keyboard,
  Monitor,
  RotateCcw,
  Settings2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Scene, supportsWebGL } from "./scene/Scene";
import { createLemegetonTerminal } from "./demo/LemegetonTerminal";
import { useMinitel } from "./hooks/useMinitel";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { defaultEffects, type CrtEffects } from "./videotex/renderer";
import { genericProfile } from "./minitel/profiles";
import { catalog, findEntry, tableCredit } from "./demo/catalog";
import { ModelInventory } from "./components/ModelInventory";
import { marbleDataUrl } from "./demo/marble";
import { MinitelAttachment } from "./minitel/MinitelAttachment";
import type { ModelInfo, ScreenSource, Vec3 } from "./minitel/types";
import type { CameraCommand } from "./scene/Camera";
import type { DebugSettings } from "./minitel/MinitelModel";
import { AccessibleTerminal } from "./components/AccessibleTerminal";
import { useProgress } from "@react-three/drei";
function Loading() {
  const { active, progress } = useProgress();
  return active ? (
    <div className="model-loading" role="status">
      Chargement du modele... <progress max={100} value={progress} />
    </div>
  ) : null;
}
function Tool({
  label,
  children,
  onClick,
  active = false,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      className={`icon-button ${active ? "active" : ""}`}
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
      <span className="tooltip">{label}</span>
    </button>
  );
}
function Antenna() {
  return (
    <group>
      <mesh position={[0, 0.29, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 0.58, 12]} />
        <meshStandardMaterial
          color="#6a746d"
          metalness={0.65}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 0.59, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#dc694e" />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.1, 0.12, 0.08, 16]} />
        <meshStandardMaterial color="#424d46" />
      </mesh>
    </group>
  );
}
export default function App() {
  const terminal = useMemo(createLemegetonTerminal, []);
  const snapshot = useMinitel(terminal);
  const [webgl] = useState(supportsWebGL);
  const [error, setError] = useState("");
  const [reader, setReader] = useState(false);
  const [settings, setSettings] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [effects, setEffects] = useState<CrtEffects>(defaultEffects);
  const reducedMotion = useReducedMotion();
  const [antenna, setAntenna] = useState(false);
  // ?vue=face|profil|dos opens on a given view ; ?capture=1 hides the interface
  // (used by tools/capture_views.mjs to illustrate the documentation page).
  const [command, setCommand] = useState<CameraCommand>(() => {
    const view = new URLSearchParams(window.location.search).get("vue");
    const kinds: Record<string, CameraCommand["kind"]> = { face: "front", profil: "side", dos: "back" };
    return { id: 0, kind: (view && kinds[view]) || "reset" };
  });
  const [input, setInput] = useState("");
  const [debug, setDebug] = useState(false);
  const [info, setInfo] = useState<ModelInfo>();
  const [inspection, setInspection] = useState<DebugSettings>({
    axes: false,
    wireframe: false,
    bounds: false,
    names: false,
  });
  const [camera, setCamera] = useState<Vec3>();
  const [metrics, setMetrics] = useState({ fps: 0, calls: 0 });
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  // ?modele=<id> picks a catalog entry; ?model=<url> still loads any GLB with the generic profile.
  const [entry, setEntry] = useState(() => findEntry(params.get("modele")));
  const custom = params.get("model");
  const model = custom ?? entry.file;
  const profile = custom ? genericProfile : entry.profile;
  const finish = custom ? undefined : entry.finish;
  // ?capture=1 : machine alone (no table), for documentation views and the
  // inventory miniatures ; &transparent=1 also drops the page background.
  const capture = params.has("capture");
  const onTable = !custom && !capture && entry.onTable;
  function chooseModel(id: string) {
    const next = findEntry(id);
    setEntry(next);
    setError("");
    const url = new URL(window.location.href);
    url.searchParams.set("modele", next.id);
    url.searchParams.delete("model");
    window.history.replaceState(null, "", url);
  }
  useEffect(() => {
    // Procedural marble behind the transparent 3D canvas (no photograph).
    document.documentElement.style.setProperty("--marble", `url(${marbleDataUrl()})`);
  }, []);
  const source: ScreenSource = useMemo(
    () => ({ kind: "videotex", frame: snapshot.frame }),
    [snapshot.frame],
  );
  const onInfo = useCallback((value: ModelInfo) => setInfo(value), []);
  const onError = useCallback((message: string) => setError(message), []);
  const onCamera = useCallback((value: Vec3) => setCamera(value), []);
  const onMetrics = useCallback(
    (fps: number, calls: number) => setMetrics({ fps, calls }),
    [],
  );
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
        ["Enter", "Escape", "Backspace", "Home"].includes(event.key)
      ) {
        event.preventDefault();
        terminal.sendKey(event.key);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [terminal]);
  function cameraCommand(kind: CameraCommand["kind"]) {
    setCommand((current) => ({ id: current.id + 1, kind }));
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (input) for (const key of input) terminal.sendKey(key);
    terminal.sendKey("Enter");
    setInput("");
  }
  const fallback = !webgl || !!error;
  return (
    <main
      className={[
        "experience",
        capture && "capture",
        capture && params.has("transparent") && "transparent",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="masthead">
        <a href={import.meta.env.BASE_URL} className="brand" aria-label="Minitel, accueil">
          <Monitor size={26} />
          <h1>
            MINITEL<span>{custom ? "MODELE EXTERNE" : entry.tagline}</span>
          </h1>
        </a>
        <div className="service">
          <a className="doc-link" href={`${import.meta.env.BASE_URL}documentation/`}>
            <FileText size={14} /> Documentation
          </a>
          <span className="status-dot" />
          <span>3615 LEMEGETON</span>
          <span className="service-state">LIAISON ETABLIE</span>
        </div>
      </header>
      <div className="scene" data-testid="scene">
        {!fallback && (
          <Scene
            model={model}
            profile={profile}
            finish={finish}
            table={onTable}
            screenSource={source}
            effects={effects}
            command={command}
            onError={onError}
            onInfo={onInfo}
            onKey={terminal.sendKey}
            debug={import.meta.env.DEV && debug ? inspection : undefined}
            selectedName={
              import.meta.env.DEV && debug ? info?.selected : undefined
            }
            onCamera={import.meta.env.DEV && debug ? onCamera : undefined}
            onMetrics={import.meta.env.DEV && debug ? onMetrics : undefined}
          >
            {antenna && (
              <MinitelAttachment anchor="top" position={[0.55, 0.06, -0.25]}>
                <Antenna />
              </MinitelAttachment>
            )}
          </Scene>
        )}
        {!fallback && <Loading />}
        {fallback && (
          <p className="fallback-status" role="status">
            {error
              ? "Mode texte / modele indisponible"
              : "Mode texte / WebGL indisponible"}
          </p>
        )}
        <div className="scene-caption">
          <span>{custom ? "00 / MODELE EXTERNE" : entry.series}</span>
          <strong>{custom ? "Modele externe" : entry.title}</strong>
          <span>{custom ? custom : entry.subtitle}</span>
        </div>
        <ModelInventory
          entries={catalog}
          selected={custom ? undefined : entry.id}
          onSelect={chooseModel}
        />
        <div className="camera-tools">
          <Tool label="Vue de face" onClick={() => cameraCommand("front")}>
            <Crosshair size={19} />
          </Tool>
          <Tool label="Recentrer" onClick={() => cameraCommand("reset")}>
            <RotateCcw size={19} />
          </Tool>
          <span />
          <Tool label="Zoomer" onClick={() => cameraCommand("zoomIn")}>
            <ZoomIn size={19} />
          </Tool>
          <Tool label="Dezoomer" onClick={() => cameraCommand("zoomOut")}>
            <ZoomOut size={19} />
          </Tool>
        </div>
      </div>
      {(reader || fallback) && (
        <aside className="reader-panel">
          <div className="panel-title">
            <h2>{snapshot.frame.title}</h2>
            {!fallback && (
              <Tool label="Fermer la lecture" onClick={() => setReader(false)}>
                <X size={18} />
              </Tool>
            )}
          </div>
          <AccessibleTerminal
            frame={snapshot.frame}
            visible
            onKey={terminal.sendKey}
          />
        </aside>
      )}
      {!reader && !fallback && (
        <AccessibleTerminal
          frame={snapshot.frame}
          visible={false}
          onKey={terminal.sendKey}
        />
      )}
      {settings && (
        <aside className="settings-panel">
          <div className="panel-title">
            <h2>Affichage CRT</h2>
            <Tool
              label="Fermer les reglages"
              onClick={() => setSettings(false)}
            >
              <X size={18} />
            </Tool>
          </div>
          {Object.entries({
            curvature: "Courbure",
            scanlines: "Lignes de balayage",
            glow: "Phosphore",
            vignette: "Vignettage",
            flicker: "Scintillement",
          }).map(([key, label]) => (
            <label className="setting" key={key}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={effects[key as keyof CrtEffects]}
                disabled={key === "flicker" && reducedMotion}
                onChange={(e) =>
                  setEffects((current) => ({
                    ...current,
                    [key]: e.target.checked,
                  }))
                }
              />
            </label>
          ))}
          <label className="setting">
            <span>Antenne experimentale</span>
            <input
              type="checkbox"
              checked={antenna}
              onChange={(e) => setAntenna(e.target.checked)}
            />
          </label>
        </aside>
      )}
      {keyboard && (
        <section className="virtual-keyboard" aria-label="Clavier du terminal">
          <div className="number-keys">
            {"1234567890".split("").map((key) => (
              <button key={key} onClick={() => terminal.sendKey(key)}>
                {key}
              </button>
            ))}
          </div>
          <div className="function-keys">
            {["Sommaire", "Correction", "Annulation", "Envoi"].map((key) => (
              <button key={key} onClick={() => terminal.sendKey(key)}>
                {key}
              </button>
            ))}
          </div>
        </section>
      )}
      {import.meta.env.DEV && debug && (
        <aside className="debug-panel">
          <div className="panel-title">
            <h2>Inspection</h2>
            <Tool label="Fermer l'inspection" onClick={() => setDebug(false)}>
              <X size={18} />
            </Tool>
          </div>
          {(["axes", "wireframe", "bounds", "names"] as const).map((key) => (
            <label className="setting" key={key}>
              {key}
              <input
                type="checkbox"
                checked={inspection[key]}
                onChange={(e) =>
                  setInspection((current) => ({
                    ...current,
                    [key]: e.target.checked,
                  }))
                }
              />
            </label>
          ))}
          <p>
            {info?.meshes.length ?? 0} meshes /{" "}
            {info?.triangles.toLocaleString("fr") ?? 0} triangles /{" "}
            {info?.textures ?? 0} textures
          </p>
          <p>
            {metrics.fps} images/s (a la demande) / {metrics.calls} appels
          </p>
          <p>Camera : {camera?.map((n) => n.toFixed(2)).join(", ") ?? "-"}</p>
          <p>Selection : {info?.selected ?? "-"}</p>
          <label>
            Meshes
            <select
              aria-label="Selection d'un mesh"
              value={info?.selected ?? ""}
              onChange={(e) =>
                setInfo((current) =>
                  current ? { ...current, selected: e.target.value } : current,
                )
              }
            >
              <option value="">Choisir</option>
              {info?.meshes.map((mesh) => (
                <option key={mesh.name} value={mesh.name}>
                  {mesh.name} ({mesh.vertices})
                </option>
              ))}
            </select>
          </label>
        </aside>
      )}
      <footer className="console">
        <div className="console-top">
          <div className="terminal-title">
            <Cable size={18} />
            <div>
              <strong>3615 LEMEGETON</strong>
              <span>
                {snapshot.frame.title === "3615 LEMEGETON"
                  ? "SOMMAIRE"
                  : snapshot.frame.title}
              </span>
            </div>
            <span className="online">EN LIGNE</span>
          </div>
          <div className="console-tools">
            <Tool
              label="Lecture accessible"
              onClick={() => {
                setReader(!reader);
                setSettings(false);
                setKeyboard(false);
              }}
              active={reader}
            >
              <BookOpen size={18} />
            </Tool>
            <Tool
              label="Clavier"
              onClick={() => {
                setKeyboard(!keyboard);
                setSettings(false);
              }}
              active={keyboard}
            >
              <Keyboard size={18} />
            </Tool>
            <Tool
              label="Reglages CRT"
              onClick={() => {
                setSettings(!settings);
                setKeyboard(false);
                setReader(false);
              }}
              active={settings}
            >
              <Settings2 size={18} />
            </Tool>
            {import.meta.env.DEV && (
              <Tool
                label="Inspecter le modele"
                onClick={() => setDebug(!debug)}
                active={debug}
              >
                <Box size={18} />
              </Tool>
            )}
          </div>
        </div>
        <div className="console-bottom">
          <nav aria-label="Navigation principale">
            <button onClick={() => terminal.go("home")} className="home-key">
              Sommaire
            </button>
            <button onClick={() => terminal.go("connection")}>
              <span>1</span>Entrer
            </button>
            <button onClick={() => terminal.go("archives")}>
              <span>2</span>Archives
            </button>
            <button onClick={() => terminal.go("messages")}>
              <span>3</span>Messages
            </button>
          </nav>
          <form onSubmit={submit}>
            <span aria-hidden="true">&gt;</span>
            <input
              aria-label="Commande du terminal"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={28}
              placeholder="Votre commande"
              autoComplete="off"
            />
            <button type="submit" aria-label="Envoi" title="Envoi">
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </footer>
      <div className="credits">
        <span>1200 BAUDS / TELETEL</span>
        {!custom && (
          <span>
            Modele :{" "}
            <a href={entry.credit.source} target="_blank" rel="noreferrer">
              {entry.credit.title}
            </a>{" "}
            par {entry.credit.author} /{" "}
            <a href={entry.credit.licenseUrl} target="_blank" rel="noreferrer">
              {entry.credit.license}
            </a>{" "}
            · {entry.credit.changes}
            {onTable && (
              <>
                {" "}· Table :{" "}
                <a href={tableCredit.source} target="_blank" rel="noreferrer">
                  {tableCredit.title}
                </a>{" "}
                par {tableCredit.author} / {tableCredit.license}
              </>
            )}
          </span>
        )}
      </div>
    </main>
  );
}
