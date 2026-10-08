// Addresses of the files in public/, versioned by their content.
//
// Models and images keep their name when replaced : without a version, the
// Cloudflare cache and the browsers would serve the old file for up to a year.
// vite.config.ts fingerprints every file of public/ at startup and injects the
// map below ; assetUrl appends ?v=<fingerprint> (the cache key includes the
// query string). Unknown or unversioned files (tests, external URLs) are left
// as they are.

declare const __ASSET_VERSIONS__: Record<string, string> | undefined;

const versions: Record<string, string> =
  typeof __ASSET_VERSIONS__ === "undefined" ? {} : __ASSET_VERSIONS__;

/** URL of a file of public/, e.g. assetUrl("models/minitel.glb"). */
export function assetUrl(path: string): string {
  const version = versions[path];
  return `${import.meta.env.BASE_URL}${path}${version ? `?v=${version}` : ""}`;
}
