// The two modes of the site and their addresses (src/SiteModes.tsx). Pure :
// the unit tests read it.

export type SiteMode = "simple" | "3d";
export const MODE_PARAM = "mode";
// Parameters of each mode, dropped on the way to the other one.
const SIMPLE_PARAMS = ["modele", "model", "vue", "ecran", "yeux", "rendu", "couleur", "taille"];
const WORLD_PARAMS = ["salle", "poste"];

export const modeOf = (search: string): SiteMode => (new URLSearchParams(search).get(MODE_PARAM) === "3d" ? "3d" : "simple");

/**
 * Address of the other mode. Into the world : its entry, the corridor. Back to
 * the simple version : the terminal of the room one was in, if any. The
 * furniture (?table=) is shared by both.
 */
export function switchedUrl(href: string, next: SiteMode, room?: string): URL {
  const url = new URL(href);
  if (next === "3d") {
    SIMPLE_PARAMS.forEach((name) => url.searchParams.delete(name));
    url.searchParams.set(MODE_PARAM, "3d");
  } else {
    WORLD_PARAMS.forEach((name) => url.searchParams.delete(name));
    url.searchParams.delete(MODE_PARAM);
    if (room) url.searchParams.set("modele", room);
  }
  return url;
}
