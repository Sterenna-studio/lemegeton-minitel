import { useSyncExternalStore } from 'react';
import type { Terminal } from '../videotex/terminal';
export function useMinitel(terminal: Terminal) { return useSyncExternalStore(terminal.subscribe,terminal.getSnapshot,terminal.getSnapshot); }
