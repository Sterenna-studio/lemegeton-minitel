import { test, expect, type Page } from "@playwright/test";
import { expectScreenCentered, scenePixels } from "./helpers";

// Closer zoom limit and focus view on the screen (2026-10-08).

async function open(page: Page, query: string) {
  await page.goto(`/simple/?${query}`);
  await expect(page.getByText("Chargement du modele...")).toHaveCount(0, { timeout: 30000 });
  await page.waitForTimeout(1200);
}
const share = (p: Awaited<ReturnType<typeof scenePixels>>) => ({
  width: (p.maxX - p.minX) / p.width,
  height: (p.maxY - p.minY) / p.height,
});

test("zoom : on s'approche plus près qu'avant", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "mesure faite sur ordinateur");
  await open(page, "modele=terminatel-255");
  for (let i = 0; i < 15; i++) await page.getByRole("button", { name: "Zoomer", exact: true }).click();
  await page.waitForTimeout(400);
  const pixels = await scenePixels(page);
  // Before the change the screen took 53 % of the height at full zoom.
  expect(share(pixels).height).toBeGreaterThan(0.7);
  expectScreenCentered(pixels);
});

test("double-clic sur l'écran : mise au point verrouillée, puis retour", async ({ page }) => {
  await open(page, "modele=minitel-1");
  const before = await scenePixels(page);
  const canvas = page.locator('[data-testid="scene"] canvas');
  const box = (await canvas.boundingBox())!;
  // The camera aims at the centre of the screen : the glass is under the centre.
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(1200);
  const focused = await scenePixels(page);
  const { width, height } = share(focused);
  expect(Math.max(width, height)).toBeGreaterThan(0.7);
  expect(height).toBeGreaterThan(share(before).height * 1.4);
  expectScreenCentered(focused);
  await expect(page.getByRole("button", { name: "Quitter la mise au point" })).toHaveAttribute("aria-pressed", "true");
  // The cards step aside (and out of the keyboard order) to free the screen.
  await expect(page.locator(".inventory")).toBeHidden();
  // Locked : dragging does not turn the view away from the screen.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 220, box.y + box.height / 2 + 60, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  expectScreenCentered(await scenePixels(page));
  expect(share(await scenePixels(page)).height).toBeCloseTo(height, 1);
  // Double-click again : back to the previous view.
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(1200);
  expect(share(await scenePixels(page)).height).toBeCloseTo(share(before).height, 1);
  await expect(page.getByRole("button", { name: "Mise au point sur l'ecran" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".inventory")).toBeVisible();
});

test("mise au point au clavier, mouvement réduit : sans animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "modele=televiseur-1950");
  const before = await scenePixels(page);
  await page.getByRole("button", { name: "Mise au point sur l'ecran" }).focus();
  await page.keyboard.press("Enter");
  // Reduced motion : the view jumps at once.
  await page.waitForTimeout(150);
  const focused = await scenePixels(page);
  expect(share(focused).height).toBeGreaterThan(share(before).height * 1.4);
  expectScreenCentered(focused);
  await page.getByRole("button", { name: "Quitter la mise au point" }).click();
  await page.waitForTimeout(150);
  expect(share(await scenePixels(page)).height).toBeCloseTo(share(before).height, 1);
});
