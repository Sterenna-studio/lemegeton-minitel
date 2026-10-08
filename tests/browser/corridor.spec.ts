import { test, expect, type Page } from "@playwright/test";
import { stagePixels } from "./helpers";

// Workshop of the corridor (lot C) : atelier/?brique=couloir.

async function open(page: Page, query = "") {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`/atelier/?brique=couloir${query}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Couloir");
  await expect.poll(async () => (await stagePixels(page)).lit, { timeout: 30000 }).toBeGreaterThan(5000);
  return errors;
}
const state = (page: Page) => page.getByTestId("etat-couloir");
const value = async (page: Page, label: string) =>
  Number(
    (await state(page).locator("div", { hasText: label }).locator("dd").innerText()).replace(/\D/g, ""),
  );

test("couloir : budget de la première vue", async ({ page }) => {
  const errors = await open(page);
  await expect(page.getByRole("status")).toHaveText("Arrivé : Entrée du couloir.");
  // Renderer figures arrive about once a second.
  await expect.poll(() => value(page, "Appels"), { timeout: 10000 }).toBeGreaterThan(0);
  // Budget of docs/MONDE_EXPLORABLE.md §8 : first view <= 120 calls, 150 k triangles.
  expect(await value(page, "Appels")).toBeLessThanOrEqual(120);
  expect(await value(page, "Triangles")).toBeLessThanOrEqual(150000);
  expect(errors).toEqual([]);
});

test("couloir : de poste en poste, puis ouvrir une porte", async ({ page }) => {
  const errors = await open(page);
  const entry = await stagePixels(page);
  await page.getByRole("button", { name: "Porte 1982", exact: true }).click();
  await expect(page).toHaveURL(/poste=porte-minitel-1/);
  await expect(state(page)).toContainText("en route");
  await expect(page.getByRole("status")).toHaveText("Arrivé : Porte 1982.", { timeout: 5000 });
  await expect(page.getByRole("button", { name: "Porte 1982", exact: true })).toHaveAttribute("aria-current", "true");
  expect((await stagePixels(page)).hash).not.toBe(entry.hash);
  await page.getByRole("button", { name: "Ouvrir la porte 1982" }).click();
  await expect(state(page)).toContainText("100 %", { timeout: 6000 });
  expect(errors).toEqual([]);
});

test("couloir : arrivée directe par l'adresse, mouvement réduit sans trajet", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "&poste=fond");
  await expect(page.getByRole("status")).toHaveText("Arrivé : Fond du couloir.");
  await page.getByRole("button", { name: "Porte 1950", exact: true }).click();
  // No travel : the camera is there at once.
  await expect(page.getByRole("status")).toHaveText("Arrivé : Porte 1950.", { timeout: 300 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
});
