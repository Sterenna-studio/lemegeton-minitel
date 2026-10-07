import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Crosshair,
  FileText,
  Monitor,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useProgress } from "@react-three/drei";
import { Scene, supportsWebGL } from "./scene/Scene";
import { genericProfile } from "./minitel/profiles";
import { catalog, findEntry, tableCredit } from "./demo/catalog";
import { findFurniture, furniture } from "./scene/furniture";
import { ModelInventory } from "./components/ModelInventory";
import { Tool } from "./components/Tool";
import { AccessibleTerminal } from "./components/AccessibleTerminal";
import { marbleDataUrl } from "./demo/marble";
import { MinitelAttachment } from "./minitel/MinitelAttachment";
import type { ModelInfo, Vec3 } from "./minitel/types";
import type { CameraCommand } from "./scene/Camera";
import type { DebugSettings } from "./minitel/MinitelModel";
import { hasUrlParam, setUrlParam, setUrlParams, urlParam } from "./hooks/urlParams";
import { useTerminalExperience, useTerminalKeyboard } from "./terminal/useTerminalExperience";
import { SettingsPanel } from "./terminal/SettingsPanel";
import {
  TerminalConsole,
  VirtualKeyboard,
  closedPanels,
  togglePanel,
  type ConsolePanels,
} from "./terminal/TerminalConsole";
import { DebugPanel } from "./terminal/DebugPanel";

// Simple version of the site (docs/MONDE_EXPLORABLE.md, §3) : the terminal
// alone, with the inventory cards, 3615, eyes, settings and furniture.

function Loading() {
  const { active, progress } = useProgress();
  return active ? (
    <div className="model-loading" role="status">
      Chargement du modele... <progress max={100} value={progress} />
    </div>
  ) : null;
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
  const experience = useTerminalExperience();
  const { activeFrame, sendKey, goTo } = experience;
  const [webgl] = useState(supportsWebGL);
  const [error, setError] = useState("");
  const [panels, setPanels] = useState<ConsolePanels>(closedPanels);
  const [antenna, setAntenna] = useState(false);
  // ?vue=face|profil|dos opens on a given view ; ?capture=1 hides the interface
  // (used by tools/capture_views.mjs to illustrate the documentation page).
  const [command, setCommand] = useState<CameraCommand>(() => {
    const view = urlParam("vue");
    const kinds: Record<string, CameraCommand["kind"]> = { face: "front", profil: "side", dos: "back" };
    return { id: 0, kind: (view && kinds[view]) || "reset" };
  });
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
  // ?modele=<id> picks a catalog entry; ?model=<url> still loads any GLB with the generic profile.
  const [entry, setEntry] = useState(() => findEntry(urlParam("modele")));
  const [custom] = useState(() => urlParam("model"));
  const model = custom ?? entry.file;
  const profile = custom ? genericProfile : entry.profile;
  const finish = custom ? undefined : entry.finish;
  // ?capture=1 : machine alone (no table), for documentation views and the
  // inventory miniatures ; &transparent=1 also drops the page background.
  const [capture] = useState(() => hasUrlParam("capture"));
  const [transparent] = useState(() => hasUrlParam("transparent"));
  const onTable = !custom && !capture && entry.onTable;
  // ?table=<id> : piece of furniture under desk terminals (or "sol").
  const [piece, setPiece] = useState(() => findFurniture(urlParam("table")));
  function choosePiece(id: string) {
    const next = findFurniture(id);
    setPiece(next);
    setUrlParam("table", next.id === furniture[0].id ? null : next.id);
  }
  function chooseModel(id: string) {
    const next = findEntry(id);
    setEntry(next);
    setError("");
    setUrlParams({ modele: next.id, model: null });
  }
  useEffect(() => {
    // Procedural marble behind the transparent 3D canvas (no photograph).
    document.documentElement.style.setProperty("--marble", `url(${marbleDataUrl()})`);
  }, []);
  const onInfo = useCallback((value: ModelInfo) => setInfo(value), []);
  const onError = useCallback((message: string) => setError(message), []);
  const onCamera = useCallback((value: Vec3) => setCamera(value), []);
  const onMetrics = useCallback(
    (fps: number, calls: number) => setMetrics({ fps, calls }),
    [],
  );
  useTerminalKeyboard(sendKey);
  function cameraCommand(kind: CameraCommand["kind"]) {
    setCommand((current) => ({ id: current.id + 1, kind }));
  }
  const fallback = !webgl || !!error;
  const inspecting = import.meta.env.DEV && debug;
  return (
    <main
      className={[
        "experience",
        capture && "capture",
        capture && transparent && "transparent",
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
            table={onTable ? piece : undefined}
            screenSource={experience.source}
            effects={experience.effects}
            command={command}
            onError={onError}
            onInfo={onInfo}
            onKey={sendKey}
            debug={inspecting ? inspection : undefined}
            selectedName={inspecting ? info?.selected : undefined}
            onCamera={inspecting ? onCamera : undefined}
            onMetrics={inspecting ? onMetrics : undefined}
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
      {(panels.reader || fallback) && (
        <aside className="reader-panel">
          <div className="panel-title">
            <h2>{activeFrame.title}</h2>
            {!fallback && (
              <Tool
                label="Fermer la lecture"
                onClick={() => setPanels((current) => ({ ...current, reader: false }))}
              >
                <X size={18} />
              </Tool>
            )}
          </div>
          <AccessibleTerminal frame={activeFrame} visible onKey={sendKey} />
        </aside>
      )}
      {!panels.reader && !fallback && (
        <AccessibleTerminal frame={activeFrame} visible={false} onKey={sendKey} />
      )}
      {panels.settings && (
        <SettingsPanel
          experience={experience}
          onClose={() => setPanels((current) => ({ ...current, settings: false }))}
          furniture={
            onTable ? { pieces: furniture, selected: piece.id, onChoose: choosePiece } : undefined
          }
          antenna={{ checked: antenna, onChange: setAntenna }}
        />
      )}
      {panels.keyboard && <VirtualKeyboard sendKey={sendKey} />}
      {inspecting && (
        <DebugPanel
          inspection={inspection}
          onInspection={setInspection}
          info={info}
          onInfo={setInfo}
          metrics={metrics}
          camera={camera}
          onClose={() => setDebug(false)}
        />
      )}
      <TerminalConsole
        frame={activeFrame}
        panels={panels}
        onToggle={(name) => setPanels((current) => togglePanel(current, name))}
        sendKey={sendKey}
        goTo={goTo}
        extraTools={
          import.meta.env.DEV && (
            <Tool
              label="Inspecter le modele"
              onClick={() => setDebug(!debug)}
              active={debug}
            >
              <Box size={18} />
            </Tool>
          )
        }
      />
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
            {onTable && piece.file && (
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
