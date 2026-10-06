/** Minitel 1 function keys, in the order of the physical keyboard. */
export const FUNCTION_KEYS = [
  { key: 'Sommaire', label: 'Sommaire' },
  { key: 'Annulation', label: 'Annulation' },
  { key: 'Retour', label: 'Retour' },
  { key: 'Repetition', label: 'Répétition' },
  { key: 'Guide', label: 'Guide' },
  { key: 'Correction', label: 'Correction' },
  { key: 'Suite', label: 'Suite' },
  { key: 'Envoi', label: 'Envoi' },
] as const;

export const CONNEXION_FIN = 'ConnexionFin';

/** Maps a PC keyboard event to a Minitel key name, or null when it should be ignored. */
export function keyFromEvent(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey'>): string | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  switch (event.key) {
    case 'Enter': return 'Envoi';
    case 'Backspace': return 'Correction';
    case 'Escape': return 'Sommaire';
    case 'Delete': return 'Annulation';
    case 'F1': return 'Guide';
  }
  return event.key.length === 1 ? event.key : null;
}
