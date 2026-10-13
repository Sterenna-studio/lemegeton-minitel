import { useSyncExternalStore } from "react";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

// Languages of the site (docs/TRADUCTION.md). The texts live in flat JSON
// catalogs, one per language, easy to hand to a translator or a translation
// tool : keys never change, values may hold {placeholders}. French is the
// reference : a key missing elsewhere falls back to it.
//
// The language comes from ?lang=, else the visitor's last choice, else the
// browser (French for a French browser, English otherwise).

export const LANGS = ["fr", "en"] as const;
export type Lang = (typeof LANGS)[number];
/** Name of each language, in itself (for the switch). */
export const LANG_NAMES: Record<Lang, string> = { fr: "Français", en: "English" };

export type MessageKey = keyof typeof fr;
const CATALOGS: Record<Lang, Partial<Record<MessageKey, string>>> = { fr, en };
const STORAGE_KEY = "minitel-musee:lang";

const isLang = (value: unknown): value is Lang => typeof value === "string" && (LANGS as readonly string[]).includes(value);

function savedLang(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** ?lang= first, then the saved choice, then the browser's languages. */
export function detectLang(search: string, saved: string | null, browser: readonly string[]): Lang {
  const asked = new URLSearchParams(search).get("lang");
  if (isLang(asked)) return asked;
  if (isLang(saved)) return saved;
  const first = browser.find((tag) => isLang(tag.slice(0, 2).toLowerCase()));
  return first ? (first.slice(0, 2).toLowerCase() as Lang) : browser.length ? "en" : "fr";
}

let current: Lang =
  typeof window === "undefined" ? "fr" : detectLang(window.location.search, savedLang(), navigator.languages ?? [navigator.language]);
const listeners = new Set<() => void>();

if (typeof document !== "undefined") document.documentElement.lang = current;

export function getLang(): Lang {
  return current;
}

/** Switches the language : saved for next visits, written in the address (shareable). */
export function setLang(lang: Lang) {
  if (lang === current) return;
  current = lang;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Private browsing : the choice lasts for the page only.
  }
  document.documentElement.lang = lang;
  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  window.history.replaceState(window.history.state, "", url);
  listeners.forEach((listener) => listener());
}

const fill = (text: string, params?: Record<string, string | number>) =>
  params ? text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole)) : text;

/** A text of the current language ; {name} placeholders take the params. */
export function t(key: MessageKey, params?: Record<string, string | number>, lang: Lang = current): string {
  return fill(CATALOGS[lang][key] ?? CATALOGS.fr[key] ?? key, params);
}

/**
 * A text whose key is built at run time (catalogue entry, furniture, eye
 * option) : the fallback is used when no catalog has the key.
 */
export function tFor(key: string, fallback: string, params?: Record<string, string | number>): string {
  const known = key as MessageKey;
  return fill(CATALOGS[current][known] ?? CATALOGS.fr[known] ?? fallback, params);
}

/** Number written the way of the current language (1,5 / 1.5). */
export function formatNumber(value: number): string {
  return value.toLocaleString(current);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current language ; the component re-renders when it changes. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, () => "fr");
}

/** The catalog of a language, for the tests (same keys, same placeholders). */
export function catalogOf(lang: Lang): Partial<Record<MessageKey, string>> {
  return CATALOGS[lang];
}
