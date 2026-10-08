import { test, expect, type Page } from "@playwright/test";
import { stagePixels as pixels } from "./helpers";

// Workshop of the temporal door (lot B) : atelier/?brique=porte.

async function open(page: Page, query = "") {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`/atelier/?brique=porte${query}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Porte temporelle");
  // Models loaded : the canvas shows more than the background.
  await expect.poll(async () => (await pixels(page)).lit, { timeout: 30000 }).toBeGreaterThan(5000);
  return errors;
}

const state = (page: Page) => page.getByTestId("etat-porte");

test("porte : la séquence ouvre la porte et fait rouler le compteur", async ({ page }) => {
  const errors = await open(page, "&porte=televiseur-1950");
  await expect(state(page)).toContainText("19??");
  await expect(state(page)).toContainText("0 %");
  const closed = await pixels(page);
  // Scrub to the end : counter on 1950, leaf open, blue-green light of the era.
  await page.getByRole("slider").fill("3");
  await expect(state(page)).toContainText("1950");
  await expect(state(page)).toContainText("100 %");
  await page.waitForTimeout(400);
  const opened = await pixels(page);
  expect(opened.hash).not.toBe(closed.hash);
  expect(opened.teal).toBeGreaterThan(closed.teal + 2000);
  // Halfway through the clock's race, time runs thousands of times faster.
  await page.getByRole("slider").fill("1.1");
  await expect(state(page)).toContainText("×7");
  expect(errors).toEqual([]);
});

test("porte : lecture, retour, choix de l'année et son", async ({ page }) => {
  const errors = await open(page);
  await page.getByRole("combobox", { name: "Porte" }).selectOption("terminatel-255");
  await expect(page).toHaveURL(/porte=terminatel-255/);
  // React Three Fiber puts the label on the canvas container.
  await expect(page.getByLabel("Porte temporelle 198?, vue 3D", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ouvrir" }).click();
  await expect(page.getByRole("status")).toHaveText("Porte 198? ouverte.", { timeout: 6000 });
  await expect(state(page)).toContainText("198?");
  await page.getByRole("button", { name: "Refermer" }).click();
  await expect(page.getByRole("status")).toHaveText("Porte 198? fermée.", { timeout: 6000 });
  await expect(state(page)).toContainText("19??");
  // Sound : off by default, a toggle.
  const sound = page.getByRole("button", { name: /Son/ });
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await expect(sound).toHaveText(/Son activé/);
  expect(errors).toEqual([]);
});

test("porte : mouvement réduit, ouverture immédiate", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "&porte=minitel-1");
  await page.getByRole("button", { name: "Ouvrir" }).click();
  // No animation : open at once.
  await expect(state(page)).toContainText("100 %", { timeout: 300 });
  await expect(page.getByRole("status")).toHaveText("Porte 1982 ouverte.");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
});
