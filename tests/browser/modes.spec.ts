import { test, expect, type Page } from "@playwright/test";

// The two modes of the site (src/SiteModes.tsx) : the simple version by
// default, « 3D+ » (the explorable world) by a button, and back.

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

test("modes : version simple par défaut, bascule en 3D+ et retour", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/?modele=minitel-1&table=table-basse");
  await expect(page.getByTestId("scene")).toBeVisible();
  await expect(page.locator(".world")).toHaveCount(0);
  await page.getByRole("button", { name: "Mode 3D+" }).click();
  // Into the world : the corridor, the furniture follows.
  await expect(page).toHaveURL(/\?table=table-basse&mode=3d$/);
  await expect(page.getByTestId("annonce")).toHaveText("Entrée du couloir. 1 déplacement possible.", { timeout: 30000 });
  await expect(page.getByTestId("scene")).toHaveCount(0);
  // Back to the simple version.
  await page.getByRole("button", { name: "Mode simple" }).click();
  await expect(page).toHaveURL(/\?table=table-basse$/);
  await expect(page.getByTestId("scene")).toBeVisible();
  // The browser's Back button returns to the world.
  await page.goBack();
  await expect(page.getByTestId("annonce")).toHaveText(/^Entrée du couloir\./, { timeout: 15000 });
  expect(errors).toEqual([]);
});

test("modes : d'une salle, la version simple montre son terminal", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/?mode=3d&salle=televiseur-1950");
  await expect(page.getByTestId("annonce")).toHaveText(/^Entrée — Televiseur 1950\./, { timeout: 30000 });
  await page.getByRole("button", { name: "Mode simple" }).click();
  await expect(page).toHaveURL(/\?modele=televiseur-1950$/);
  await expect(page.locator(".brand h1")).toContainText("1950");
  expect(errors).toEqual([]);
});
