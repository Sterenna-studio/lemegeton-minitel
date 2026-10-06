import { describe, expect, it } from 'vitest';
import { createLemegetonTerminal } from '../src/demo/LemegetonTerminal';
import { createScreen, plainText, text, COLS, ROWS } from '../src/videotex/screen';
import { keyFromEvent } from '../src/minitel/keys';

const key = (value: string) => ({ key: value, ctrlKey: false, metaKey: false, altKey: false });

describe('screen', () => {
  it('creates a 40x25 grid and clips text to it', () => {
    const screen = createScreen('TEST');
    expect(screen.cells).toHaveLength(COLS * ROWS);
    text(screen, 38, 0, 'ABCD');
    text(screen, 0, ROWS, 'HORS ECRAN');
    expect(plainText(screen)).toBe('AB');
  });
});

describe('terminal', () => {
  it('opens on the home page', () => {
    const terminal = createLemegetonTerminal();
    expect(terminal.getSnapshot().page).toBe('home');
    expect(plainText(terminal.getSnapshot().frame)).toContain('3615 LEMEGETON');
  });

  it('follows a direct action key and returns with Sommaire', () => {
    const terminal = createLemegetonTerminal();
    terminal.sendKey('2');
    expect(terminal.getSnapshot().page).toBe('archives');
    terminal.sendKey('Sommaire');
    expect(terminal.getSnapshot().page).toBe('home');
  });

  it('notifies subscribers on navigation', () => {
    const terminal = createLemegetonTerminal();
    let calls = 0;
    const unsubscribe = terminal.subscribe(() => calls++);
    terminal.sendKey('1');
    unsubscribe();
    terminal.sendKey('Sommaire');
    expect(calls).toBe(1);
  });

  it('types, corrects and sends input', () => {
    const terminal = createLemegetonTerminal();
    terminal.sendKey('1');
    terminal.sendKey('x');
    expect(terminal.getSnapshot().input).toBe('X');
    terminal.sendKey('Correction');
    expect(terminal.getSnapshot().input).toBe('');
    terminal.sendKey('Envoi');
    expect(terminal.getSnapshot().page).toBe('identity');
  });
});

describe('keyboard mapping', () => {
  it('maps PC keys to Minitel keys', () => {
    expect(keyFromEvent(key('Enter'))).toBe('Envoi');
    expect(keyFromEvent(key('Backspace'))).toBe('Correction');
    expect(keyFromEvent(key('Escape'))).toBe('Sommaire');
    expect(keyFromEvent(key('7'))).toBe('7');
    expect(keyFromEvent(key('Shift'))).toBeNull();
    expect(keyFromEvent({ ...key('r'), ctrlKey: true })).toBeNull();
  });
});
