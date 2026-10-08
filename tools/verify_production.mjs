import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
async function availablePort() {
  for (let port = 4174; port < 4185; port++) {
    const probe = createServer();
    const free = await new Promise((resolve) => {
      probe.once("error", () => resolve(false));
      probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
    });
    if (free) return port;
  }
  throw new Error("Aucun port de verification libre");
}
const port = await availablePort();
const server = spawn(
  process.execPath,
  [
    path.join(root, "node_modules/vite/bin/vite.js"),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { cwd: root, windowsHide: true },
);
let browser;
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Preview indisponible")),
      15000,
    );
    server.stdout.on("data", (data) => {
      if (data.toString().includes(`:${port}/`)) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Preview quitte: ${code}`));
    });
    server.once("error", reject);
  });
  browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: ["--enable-webgl", "--ignore-gpu-blocklist"],
  });
  const results = [];
  for (const [name, viewport] of [
    ["desktop", { width: 1440, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    const asset = page.waitForResponse((response) =>
      /\/models\/minitel\.glb(\?v=\w+)?$/.test(response.url()),
    );
    await page.goto(`http://127.0.0.1:${port}/`);
    const response = await asset;
    if (response.status() !== 200)
      throw new Error("Asset de production indisponible");
    await page.waitForTimeout(1500);
    if (await page.getByRole("button", { name: "Inspecter le modele" }).count())
      throw new Error("Inspecteur present en production");
    await page
      .locator(".console-bottom nav")
      .getByRole("button", { name: /Archives/ })
      .click();
    await page
      .getByRole("button", { name: "Lecture accessible", exact: true })
      .click();
    await page.locator(".reader-panel h2").waitFor();
    if ((await page.locator(".reader-panel h2").textContent()) !== "ARCHIVES")
      throw new Error("Navigation de production incorrecte");
    await page
      .getByRole("button", { name: "Fermer la lecture", exact: true })
      .click();
    await page.waitForTimeout(250);
    await page.screenshot({
      path: path.join(root, `docs/verification/production-${name}.png`),
    });
    if (errors.length) throw new Error(errors.join("\n"));
    results.push({
      name,
      viewport,
      assetStatus: response.status(),
      webglCanvas: await page.locator(".scene canvas").count(),
      debugAbsent: true,
      navigation: true,
      consoleErrors: errors,
    });
    await page.close();
  }
  await writeFile(
    path.join(root, "docs/verification/production.json"),
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser?.close();
  if (server.exitCode === null) {
    const closed = once(server, "exit");
    server.kill();
    await closed;
  }
}
