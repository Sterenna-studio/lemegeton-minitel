// URL state, in one place. Settings (screen, eyes, model, furniture…) replace
// the current history entry ; the explorable world will push one entry per
// station (docs/MONDE_EXPLORABLE.md, §4).

export function urlParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

export function hasUrlParam(name: string): boolean {
  return new URLSearchParams(window.location.search).has(name);
}

/** Sets (string) or removes (null) several parameters in one history update. */
export function setUrlParams(
  values: Record<string, string | null>,
  mode: "replace" | "push" = "replace",
) {
  const url = new URL(window.location.href);
  for (const [name, value] of Object.entries(values)) {
    if (value === null) url.searchParams.delete(name);
    else url.searchParams.set(name, value);
  }
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

export function setUrlParam(name: string, value: string | null) {
  setUrlParams({ [name]: value });
}
