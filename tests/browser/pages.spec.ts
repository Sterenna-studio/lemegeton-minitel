import { test, expect, type Page } from "@playwright/test";
import { expectScreenCentered, scenePixels } from "./helpers";

// Entries added for the explorable world (docs/MONDE_EXPLORABLE.md, §3 and §9).

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

test("version simple : le terminal actuel sur /simple/", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/simple/?modele=minitel-1");
  await expect(page).toHaveTitle("Minitel - version simple");
  await expect(page.getByText("Chargement du modele...")).toHaveCount(0, { timeout: 30000 });
  await expect(page.getByRole("radio", { name: "Minitel 1" })).toHaveAttribute("aria-checked", "true");
  await page.waitForTimeout(1500);
  const pixels = await scenePixels(page);
  expect(pixels.object).toBeGreaterThan(1500);
  expect(pixels.colored).toBeGreaterThan(100);
  expectScreenCentered(pixels);
  // Settings still write to the URL of the simple version.
  await page.getByRole("radio", { name: "Terminatel 255" }).click();
  await expect(page).toHaveURL(/\/simple\/\?modele=terminatel-255$/);
  expect(errors).toEqual([]);
});

test("atelier : briques du monde et page de chaque brique", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/atelier/");
  await expect(page).toHaveTitle("Atelier - Minitel 3D");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Briques du monde");
  const cards = page.locator(".atelier-grid li");
  await expect(cards).toHaveCount(3);
  await page.getByRole("link", { name: /Porte temporelle/ }).click();
  await expect(page).toHaveURL(/\/atelier\/\?brique=porte$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Porte temporelle");
  await expect(page.getByRole("status")).toHaveText("En préparation : lot B.");
  await page.getByRole("link", { name: "Toutes les briques" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Briques du monde");
  await expect(page.getByRole("link", { name: /Version simple/ })).toHaveAttribute("href", "/simple/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  expect(errors).toEqual([]);
});
