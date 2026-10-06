import { test, expect, type Page } from "@playwright/test";
import { PerspectiveCamera, Vector3 } from "three";
import { cameraTarget, framings, viewPosition } from "../../src/scene/framing";
import { suppliedProfile } from "../../src/minitel/profiles";
test("lecture Canvas apres changement de visibilite avec frame stable", async ({ page }) => {
  await page.goto("/");
  const alpha = await page.evaluate(async () => {
    const reactUrl = "/node_modules/.vite/deps/react.js";
    const clientUrl = "/node_modules/.vite/deps/react-dom_client.js";
    const componentUrl = "/src/components/AccessibleTerminal.tsx";
    const screenUrl = "/src/videotex/screen.ts";
    const reactModule: { default: typeof import("react") } = await import(reactUrl);
    const clientModule: { default: typeof import("react-dom/client") } = await import(clientUrl);
    const react = reactModule.default;
    const client = clientModule.default;
    const component: typeof import("../../src/components/AccessibleTerminal") = await import(componentUrl);
    const screen: typeof import("../../src/videotex/screen") = await import(screenUrl);
    const host = document.createElement("div"); document.body.append(host);
    const root = client.createRoot(host); const frame = screen.createScreen("STABLE");
    try {
      root.render(react.createElement(component.AccessibleTerminal, {frame, visible: false, onKey: () => {}}));
      await new Promise(resolve => setTimeout(resolve, 60));
      root.render(react.createElement(component.AccessibleTerminal, {frame, visible: true, onKey: () => {}}));
      await new Promise(resolve => setTimeout(resolve, 60));
      return host.querySelector("canvas")?.getContext("2d")?.getImageData(0, 0, 1, 1).data[3] ?? 0;
    } finally {root.unmount(); host.remove();}
  });
  expect(alpha).toBe(255);
});
async function scenePixels(page: Page) {
  return page.locator('[data-testid="scene"] canvas').evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2");
    if (!gl) throw new Error("WebGL2 absent");
    const pixels = new Uint8Array(
      gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
    );
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels,
    );
    // The canvas is transparent over a dark CSS background : opaque pixels are
    // the model, while the shadow catcher stays translucent.
    let object = 0,
      colored = 0,
      hash = 0,
      minX = Infinity,
      maxX = 0,
      minY = Infinity,
      maxY = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] >= 250) object++;
      // Bounds follow the green phosphor of the screen : the terminal itself
      // must stay in frame, while its table may run off the edges.
      if (
        pixels[i + 3] >= 250 &&
        pixels[i + 1] > pixels[i] * 1.2 &&
        pixels[i + 1] > pixels[i + 2] * 1.05
      ) {
        colored++;
        const x = (i / 4) % gl.drawingBufferWidth;
        const y = Math.floor(i / 4 / gl.drawingBufferWidth);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      hash =
        (hash + pixels[i] * 3 + pixels[i + 1] * 5 + pixels[i + 2] * 7) %
        1000000007;
    }
    return {
      object,
      colored,
      hash,
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      minX,
      maxX,
      minY,
      maxY,
    };
  });
}
// The camera aims at the centre of the screen : the green phosphor block must
// sit around the middle of the canvas.
function expectScreenCentered(p: Awaited<ReturnType<typeof scenePixels>>) {
  const cx = (p.minX + p.maxX) / 2 / p.width;
  const cy = (p.minY + p.maxY) / 2 / p.height;
  expect(Math.abs(cx - 0.5)).toBeLessThan(0.06);
  expect(Math.abs(cy - 0.5)).toBeLessThan(0.06);
}
test("asset, ecran dynamique, navigation, camera et responsive", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.getByText("Chargement du modele...")).toHaveCount(0, {
    timeout: 30000,
  });
  await expect(page.locator('[data-testid="scene"] canvas')).toBeVisible();
  await page.waitForTimeout(1500);
  const initial = await scenePixels(page);
  expect(initial.object).toBeGreaterThan(1500);
  expect(initial.colored).toBeGreaterThan(100);
  expect(initial.minX).toBeGreaterThan(2);
  expect(initial.maxX).toBeLessThan(initial.width - 2);
  expect(initial.minY).toBeGreaterThan(2);
  expect(initial.maxY).toBeLessThan(initial.height - 2);
  expectScreenCentered(initial);
  await page.screenshot({
    path: `docs/verification/${testInfo.project.name}-home.png`,
  });
  await page
    .locator(".console-bottom nav")
    .getByRole("button", { name: /Archives/ })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "ARCHIVES" }),
  ).toBeAttached();
  await page.waitForTimeout(250);
  const changed = await scenePixels(page);
  expect(changed.hash).not.toBe(initial.hash);
  await page.getByRole("button", { name: "Vue de face", exact: true }).click();
  await page.waitForTimeout(250);
  const front = await scenePixels(page);
  expect(front.hash).not.toBe(changed.hash);
  const canvas = page.locator('[data-testid="scene"] canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas sans dimensions");
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5, {
    steps: 8,
  });
  await page.mouse.up();
  await page.waitForTimeout(250);
  expect((await scenePixels(page)).hash).not.toBe(front.hash);
  await page.getByRole("button", { name: "Recentrer", exact: true }).click();
  await page
    .getByRole("button", { name: "Lecture accessible", exact: true })
    .click();
  await expect(page.locator(".reader-panel")).toContainText("ARCHIVES");
  await page
    .getByRole("button", { name: "RETOUR AU SOMMAIRE", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Fermer la lecture", exact: true })
    .click();
  await page.getByRole("button", { name: "Clavier", exact: true }).click();
  await page
    .locator(".virtual-keyboard")
    .getByRole("button", { name: "1", exact: true })
    .click();
  await page
    .locator(".virtual-keyboard")
    .getByRole("button", { name: "Envoi", exact: true })
    .click();
  await expect(page.locator(".terminal-title")).toContainText("IDENTIFICATION");
  await page.getByRole("button", { name: "Reglages CRT", exact: true }).click();
  await page.getByLabel("Antenne experimentale").check();
  await page.waitForTimeout(250);
  await page.screenshot({
    path: `docs/verification/${testInfo.project.name}-settings.png`,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const overlap = await page.evaluate(() => {
    const a = document
      .querySelector(".settings-panel")!
      .getBoundingClientRect();
    const b = document.querySelector(".console")!.getBoundingClientRect();
    return a.bottom > b.top;
  });
  expect(overlap).toBe(false);
  expect(errors).toEqual([]);
});
test("reduced motion neutralise le scintillement", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Reglages CRT", exact: true }).click();
  await expect(page.getByLabel("Scintillement")).toBeDisabled();
});
test("fallback sans WebGL garde la navigation", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).startsWith("webgl")) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.getByText("Mode texte / WebGL indisponible")).toBeVisible();
  await page
    .locator(".console-bottom nav")
    .getByRole("button", { name: /Archives/ })
    .click();
  await expect(page.locator(".reader-panel h2")).toHaveText("ARCHIVES");
});
test("touche 3D, clavier physique, zoom et inspection", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: "Vue de face", exact: true }).click();
  const canvas = page.locator('[data-testid="scene"] canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas absent");
  const camera = new PerspectiveCamera(40, box.width / box.height, 0.1, 80);
  // Default model : Terminatel 255, on its table ("desk" framing).
  const desk = framings.desk;
  const narrow = box.width / box.height < 1.2;
  const target = cameraTarget(suppliedProfile);
  camera.position.set(...viewPosition(target, narrow ? desk.front.narrow : desk.front.wide));
  camera.lookAt(...target);
  camera.updateMatrixWorld();
  const projected = new Vector3(0.595, 0.275, 1.47).project(camera);
  await page.mouse.click(
    box.x + ((projected.x + 1) * box.width) / 2,
    box.y + ((1 - projected.y) * box.height) / 2,
  );
  await expect(page.locator(".terminal-title")).toContainText("CONNEXION");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("status").filter({ hasText: "IDENTIFICATION" }),
  ).toBeAttached();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("status").filter({ hasText: "3615" }),
  ).toBeAttached();
  const before = await scenePixels(page);
  await page.getByRole("button", { name: "Zoomer", exact: true }).click();
  await page.waitForTimeout(200);
  expect((await scenePixels(page)).hash).not.toBe(before.hash);
  await page.getByRole("button", { name: "Dezoomer", exact: true }).click();
  await page
    .getByRole("button", { name: "Inspecter le modele", exact: true })
    .click();
  await expect(page.locator(".debug-panel")).toContainText("71 meshes");
  for (const name of ["axes", "bounds", "wireframe", "names"])
    await page.getByLabel(name, { exact: true }).check();
  await page.getByLabel("Selection d'un mesh").selectOption("Minitel_Screen");
  await page.waitForTimeout(200);
  await page.screenshot({
    path: `docs/verification/${testInfo.project.name}-debug.png`,
  });
  await page
    .getByRole("button", { name: "Fermer l'inspection", exact: true })
    .click();
  await page.waitForTimeout(150);
  expect(errors).toEqual([]);
});
test("petit ecran et tablette sans debordement", async ({ page }, testInfo) => {
  const size =
    testInfo.project.name === "mobile"
      ? { width: 320, height: 640 }
      : { width: 768, height: 1024 };
  await page.setViewportSize(size);
  await page.goto("/");
  await page.waitForTimeout(1700);
  const pixels = await scenePixels(page);
  expect(pixels.object).toBeGreaterThan(1000);
  expect(pixels.minX).toBeGreaterThan(2);
  expect(pixels.maxX).toBeLessThan(pixels.width - 2);
  expect(pixels.minY).toBeGreaterThan(2);
  expect(pixels.maxY).toBeLessThan(pixels.height - 2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `docs/verification/${testInfo.project.name === "mobile" ? "small-mobile" : "tablet"}-home.png`,
  });
  await page.getByRole("button", { name: "Reglages CRT", exact: true }).click();
  const overlap = await page.evaluate(
    () =>
      document.querySelector(".settings-panel")!.getBoundingClientRect()
        .bottom >
      document.querySelector(".console")!.getBoundingClientRect().top,
  );
  expect(overlap).toBe(false);
});
test("bascule entre les modeles du catalogue", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.getByText("Chargement du modele...")).toHaveCount(0, {
    timeout: 30000,
  });
  const switcher = page.getByRole("radiogroup", { name: "Modele 3D" });
  await expect(switcher.getByRole("radio", { checked: true })).toHaveText(
    "Terminatel 255",
  );
  await page.waitForTimeout(800);
  const terminatel = await scenePixels(page);
  await switcher.getByRole("radio", { name: "Televiseur 1950" }).click();
  await expect(page).toHaveURL(/modele=televiseur-1950/);
  await expect(page.locator(".scene-caption strong")).toHaveText(
    "Televiseur 1950",
  );
  await expect(page.locator(".credits")).toContainText("Huuxloc");
  await expect(page.getByText("Chargement du modele...")).toHaveCount(0, {
    timeout: 30000,
  });
  await page.waitForTimeout(800);
  const television = await scenePixels(page);
  expect(television.object).toBeGreaterThan(1000);
  expect(television.colored).toBeGreaterThan(100);
  expectScreenCentered(television);
  expect(television.hash).not.toBe(terminatel.hash);
  await switcher.getByRole("radio", { name: "Televiseur 1950" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(switcher.getByRole("radio", { checked: true })).toHaveText(
    "Minitel 1",
  );
  await expect(page.locator(".credits")).toContainText("okotaru");
  await page.goto("/?modele=televiseur-1950");
  await expect(switcher.getByRole("radio", { checked: true })).toHaveText(
    "Televiseur 1950",
  );
  expect(errors).toEqual([]);
});
test("page documentation : fiches, vues et liens", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Documentation" }).click();
  await expect(page).toHaveURL(/\/documentation\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Documentation des terminaux",
  );
  for (const title of ["Terminatel 255", "Minitel 1", "Televiseur 1950"])
    await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
  const section = page.locator("#televiseur-1950");
  await section.getByRole("button", { name: "Dos" }).click();
  await expect(section.locator(".viewer > img")).toHaveAttribute(
    "src",
    /televiseur-1950-dos\.jpg$/,
  );
  await expect(section.getByRole("link", { name: /Ouvrir dans le terminal 3D/ })).toHaveAttribute(
    "href",
    /\?modele=televiseur-1950$/,
  );
  await expect(page.locator(".reference-list li")).toHaveCount(18);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("yeux de Lemegeton en mosaique Videotex", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/?ecran=yeux&couleur=ambre");
  await expect(page.getByText("Chargement du modele...")).toHaveCount(0, {
    timeout: 30000,
  });
  const reader = page.locator("pre").filter({ hasText: "HUMEUR" });
  await expect(reader).toContainText("HUMEUR : NEUTRE");
  await expect(page.locator(".terminal-title")).toContainText("YEUX DE LEMEGETON");
  await page.waitForTimeout(800);
  const neutral = await scenePixels(page);
  await page.locator('[data-testid="scene"] canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("Enter"); // Envoi : joie
  await expect(reader).toContainText("HUMEUR : JOIE");
  await page.waitForTimeout(300);
  expect((await scenePixels(page)).hash).not.toBe(neutral.hash);
  await page.getByRole("button", { name: "Reglages CRT", exact: true }).click();
  await expect(page.getByLabel("Forme des yeux")).toHaveValue("zyra");
  await expect(page.getByLabel("Couleur des yeux")).toHaveValue("ambre");
  await page.getByLabel("Couleur des yeux").selectOption("auto");
  await expect(page).toHaveURL(/couleur=auto/);
  await page.getByLabel("3615 Lemegeton").check();
  await expect(page).not.toHaveURL(/ecran=yeux/);
  await expect(page.locator(".terminal-title")).toContainText("SOMMAIRE");
  await page.getByLabel("Yeux de Lemegeton").check();
  await page
    .locator(".console-bottom nav")
    .getByRole("button", { name: /Archives/ })
    .click();
  await expect(page.locator(".terminal-title")).toContainText("ARCHIVES");
  expect(errors).toEqual([]);
});
