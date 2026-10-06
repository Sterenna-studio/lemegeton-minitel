import { useEffect, useMemo, useState } from 'react';
import { MinitelScene } from './scene/MinitelScene';
import { MinitelModel } from './minitel/MinitelModel';
import { MinitelKeypad } from './minitel/MinitelKeypad';
import { keyFromEvent } from './minitel/keys';
import { useVideotexTexture } from './minitel/useVideotexTexture';
import { useMinitel } from './hooks/useMinitel';
import { useReducedMotion } from './hooks/useReducedMotion';
import { defaultEffects, type CrtEffects } from './videotex/renderer';
import { plainText, type TerminalFrame } from './videotex/screen';
import { createLemegetonTerminal } from './demo/LemegetonTerminal';

const EFFECT_LABELS: { id: keyof CrtEffects; label: string }[] = [
  { id: 'scanlines', label: 'Lignes de balayage' },
  { id: 'vignette', label: 'Vignettage' },
  { id: 'glow', label: 'Lueur du phosphore' },
  { id: 'flicker', label: 'Scintillement' },
];

function Screen({ frame, effects, reducedMotion }: { frame: TerminalFrame; effects: CrtEffects; reducedMotion: boolean }) {
  const texture = useVideotexTexture(frame, effects, reducedMotion);
  return <MinitelModel screen={texture} />;
}

export function App() {
  const terminal = useMemo(createLemegetonTerminal, []);
  const { frame } = useMinitel(terminal);
  const reducedMotion = useReducedMotion();
  const [effects, setEffects] = useState<CrtEffects>(defaultEffects);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, button, textarea, select')) return;
      const key = keyFromEvent(event);
      if (!key) return;
      event.preventDefault();
      terminal.sendKey(key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [terminal]);

  return (
    <main className="app">
      <section className="stage" aria-label="Minitel en 3D">
        <MinitelScene>
          <Screen frame={frame} effects={effects} reducedMotion={reducedMotion} />
        </MinitelScene>
      </section>
      <aside className="panel">
        <h1>3615 Lemegeton</h1>
        <p className="hint">Tapez au clavier : chiffres, Entrée pour Envoi, Retour arrière pour Correction, Échap pour Sommaire.</p>
        <MinitelKeypad onKey={terminal.sendKey} />
        <fieldset className="effects">
          <legend>Effets CRT</legend>
          {EFFECT_LABELS.map(({ id, label }) => (
            <label key={id}>
              <input type="checkbox" checked={effects[id]} disabled={id === 'flicker' && reducedMotion}
                onChange={event => setEffects({ ...effects, [id]: event.target.checked })} />
              {label}
            </label>
          ))}
        </fieldset>
        <p className="credit">
          Modèle 3D : <a href="https://sketchfab.com/3d-models/minitel-1982-france-864f54ce4e1f41abab0688b88a45babf">Minitel 1982-France</a>{' '}
          par okotaru, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>, adapté (orientation, échelle, écran séparé).
        </p>
        <pre className="sr-only" aria-live="polite" data-testid="screen-text">{plainText(frame)}</pre>
      </aside>
    </main>
  );
}
