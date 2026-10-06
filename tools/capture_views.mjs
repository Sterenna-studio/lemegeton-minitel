// Captures the views shown on the documentation page, from the 3D app itself :
// node tools/capture_views.mjs [http://127.0.0.1:5174]
// Needs a running dev or preview server. Uses the installed Edge, like the tests.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const base = (process.argv[2] ?? "http://127.0.0.1:5174").replace(/\/$/, "");
const root = fileURLToPath(new URL("../", import.meta.url));
const out = path.join(root, "public/documentation/vues");
const models = ["terminatel-255", "minitel-1", "televiseur-1950"];
const views = ["trois-quarts", "face", "profil", "dos"];

await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  channel: "msedge",
  args: ["--enable-webgl", "--ignore-gpu-blocklist"],
});
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const model of models)
    for (const view of views) {
      await page.goto(`${base}/?modele=${model}&vue=${view}&capture=1`);
      await page.waitForFunction(() => !document.body.textContent?.includes("Chargement du modele"), null, { timeout: 30000 });
      await page.waitForTimeout(1500);
      const file = path.join(out, `${model}-${view}.jpg`);
      await page.locator('[data-testid="scene"]').screenshot({ path: file, type: "jpeg", quality: 82 });
      console.log("capture", path.relative(root, file));
    }
  if (errors.length) throw new Error(errors.join("\n"));
} finally {
  await browser.close();
}
