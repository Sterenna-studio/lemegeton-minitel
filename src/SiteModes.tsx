import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import App from "./App";
import { modeOf, switchedUrl, type SiteMode } from "./siteMode";

// Two modes of the site (decision of 2026-10-08) : the simple version (a
// terminal on its table, the catalogue) by default, and « 3D+ », the
// explorable world (corridor, temporal doors, rooms), switched by a button in
// the page. The mode is in the address (?mode=3d) so it survives a reload and
// can be shared ; the world's code only loads when the mode is chosen.

const WorldApp = lazy(() => import("./world/WorldApp").then((module) => ({ default: module.WorldApp })));

export function SiteModes() {
  const [mode, setMode] = useState<SiteMode>(() => modeOf(window.location.search));
  // The browser's Back button may cross from one mode to the other.
  useEffect(() => {
    const pop = () => setMode(modeOf(window.location.search));
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  const choose = useCallback((next: SiteMode, room?: string) => {
    window.history.pushState(null, "", switchedUrl(window.location.href, next, room));
    window.scrollTo(0, 0);
    setMode(next);
  }, []);
  if (mode === "simple") return <App onMode3d={() => choose("3d")} />;
  return (
    <Suspense fallback={<p className="mode-loading" role="status">Chargement du mode 3D+…</p>}>
      <WorldApp onSimple={(room) => choose("simple", room)} />
    </Suspense>
  );
}
