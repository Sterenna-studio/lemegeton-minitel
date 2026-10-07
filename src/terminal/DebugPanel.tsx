import type { Dispatch, SetStateAction } from "react";
import { X } from "lucide-react";
import { Tool } from "../components/Tool";
import type { DebugSettings } from "../minitel/MinitelModel";
import type { ModelInfo, Vec3 } from "../minitel/types";

/** Development inspection : helpers, model figures, camera and mesh picking. */
export function DebugPanel({
  inspection,
  onInspection,
  info,
  onInfo,
  metrics,
  camera,
  onClose,
}: {
  inspection: DebugSettings;
  onInspection: Dispatch<SetStateAction<DebugSettings>>;
  info?: ModelInfo;
  onInfo: Dispatch<SetStateAction<ModelInfo | undefined>>;
  metrics: { fps: number; calls: number };
  camera?: Vec3;
  onClose: () => void;
}) {
  return (
    <aside className="debug-panel">
      <div className="panel-title">
        <h2>Inspection</h2>
        <Tool label="Fermer l'inspection" onClick={onClose}>
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
              onInspection((current) => ({
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
            onInfo((current) =>
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
  );
}
