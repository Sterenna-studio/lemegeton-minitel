import { X } from "lucide-react";
import { Tool } from "../components/Tool";
import { defaultEffects, type CrtEffects } from "../videotex/renderer";
import {
  EYE_PALETTES,
  EYE_RENDERS,
  EYE_STYLES,
  MIN_EYE_SCALE,
  type EyePaletteId,
  type EyeRenderId,
  type EyeStyleId,
} from "../eyes/EyesController";
import type { Furniture } from "../scene/furniture";
import type { TerminalExperience } from "./useTerminalExperience";

const EFFECT_LABELS: Record<keyof CrtEffects, string> = {
  curvature: "Distorsion de l'image",
  scanlines: "Lignes de balayage",
  glow: "Phosphore",
  vignette: "Vignettage",
  flicker: "Scintillement",
};

/** CRT effects, screen (3615 / eyes) and eye options, plus scene extras. */
export function SettingsPanel({
  experience,
  onClose,
  furniture,
  antenna,
}: {
  experience: TerminalExperience;
  onClose: () => void;
  /** Furniture choice, only for desk terminals. */
  furniture?: { pieces: Furniture[]; selected: string; onChoose: (id: string) => void };
  antenna?: { checked: boolean; onChange: (checked: boolean) => void };
}) {
  const { effects, setEffects, reducedMotion, screenMode, chooseScreen, eyesSnapshot } =
    experience;
  return (
    <aside className="settings-panel">
      <div className="panel-title">
        <h2>Affichage CRT</h2>
        <Tool label="Fermer les reglages" onClick={onClose}>
          <X size={18} />
        </Tool>
      </div>
      <label className="setting setting-master">
        <span>Effets CRT</span>
        <input
          type="checkbox"
          checked={Object.values(effects).some(Boolean)}
          onChange={(e) =>
            setEffects(
              e.target.checked
                ? { ...defaultEffects }
                : { curvature: false, scanlines: false, glow: false, vignette: false, flicker: false },
            )
          }
        />
      </label>
      {Object.entries(EFFECT_LABELS).map(([key, label]) => (
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
      <fieldset className="setting-group">
        <legend>Ecran</legend>
        {(
          [
            ["3615", "3615 Lemegeton"],
            ["yeux", "Yeux de Lemegeton"],
          ] as const
        ).map(([mode, label]) => (
          <label className="setting" key={mode}>
            <span>{label}</span>
            <input
              type="radio"
              name="ecran"
              checked={screenMode === mode}
              onChange={() => chooseScreen(mode)}
            />
          </label>
        ))}
        {screenMode === "yeux" && (
          <label className="setting">
            <span>Rendu des yeux</span>
            <select
              value={eyesSnapshot.render}
              onChange={(e) => experience.chooseRender(e.target.value as EyeRenderId)}
            >
              {EYE_RENDERS.map((render) => (
                <option key={render.id} value={render.id}>
                  {render.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {screenMode === "yeux" && eyesSnapshot.render === "mosaique" && (
          <label className="setting">
            <span>Forme des yeux</span>
            <select
              value={eyesSnapshot.style}
              onChange={(e) => experience.chooseStyle(e.target.value as EyeStyleId)}
            >
              {EYE_STYLES.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {screenMode === "yeux" && (
          <label className="setting setting-range">
            <span>Taille des yeux</span>
            <input
              type="range"
              min={MIN_EYE_SCALE}
              max={eyesSnapshot.maxScale}
              step={0.1}
              value={eyesSnapshot.scale}
              aria-valuetext={`fois ${eyesSnapshot.scale.toLocaleString("fr")}`}
              onChange={(e) => experience.chooseScale(Number(e.target.value))}
            />
            <output>×{eyesSnapshot.scale.toLocaleString("fr")}</output>
          </label>
        )}
        {screenMode === "yeux" && (
          <label className="setting">
            <span>Couleur des yeux</span>
            <select
              value={eyesSnapshot.palette}
              onChange={(e) => experience.choosePalette(e.target.value as EyePaletteId)}
            >
              {EYE_PALETTES.map((palette) => (
                <option key={palette.id} value={palette.id}>
                  {palette.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </fieldset>
      {furniture && (
        <label className="setting">
          <span>Mobilier</span>
          <select value={furniture.selected} onChange={(e) => furniture.onChoose(e.target.value)}>
            {furniture.pieces.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {antenna && (
        <label className="setting">
          <span>Antenne experimentale</span>
          <input
            type="checkbox"
            checked={antenna.checked}
            onChange={(e) => antenna.onChange(e.target.checked)}
          />
        </label>
      )}
    </aside>
  );
}
