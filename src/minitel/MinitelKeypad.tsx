import { CONNEXION_FIN, FUNCTION_KEYS } from './keys';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

export interface MinitelKeypadProps { onKey: (key: string) => void }

/** On-screen Minitel keys; the parent decides what each key does. */
export function MinitelKeypad({ onKey }: MinitelKeypadProps) {
  return (
    <div className="keypad" role="group" aria-label="Clavier Minitel">
      <div className="keypad-digits">
        {DIGITS.map(key => <button key={key} type="button" onClick={() => onKey(key)}>{key}</button>)}
      </div>
      <div className="keypad-functions">
        {FUNCTION_KEYS.map(({ key, label }) => (
          <button key={key} type="button" className={key === 'Envoi' ? 'key-send' : undefined} onClick={() => onKey(key)}>{label}</button>
        ))}
        <button type="button" className="key-connexion" onClick={() => onKey(CONNEXION_FIN)}>Connexion / Fin</button>
      </div>
    </div>
  );
}
