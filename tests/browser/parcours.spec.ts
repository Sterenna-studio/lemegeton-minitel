import { test, expect, type Page } from "@playwright/test";
import { stagePixels } from "./helpers";

// The explorable world on its rails (lot D) : /parcours/.

async function open(page: Page, query = "") {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`/parcours/${query}`);
  await expect.poll(async () => (await stagePixels(page, '[data-testid="monde"]')).lit, { timeout: 30000 }).toBeGreaterThan(5000);
  return errors;
}
const status = (page: Page) => page.getByRole("status");
const actions = (page: Page) => page.getByRole("toolbar", { name: "Déplacements" });

test("parcours au clavier seul : couloir → porte → salle → retour", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "parcours au clavier sur ordinateur");
  const errors = await open(page);
  await expect(status(page)).toHaveText("Entrée du couloir. 1 déplacement possible.");
  // Tab to the actions, Enter to walk.
  await actions(page).getByRole("button", { name: /Aller : Porte 1950/ }).focus();
  await page.keyboard.press("Enter");
  await expect(status(page)).toHaveText("Porte 1950. 3 déplacements possibles.", { timeout: 6000 });
  await expect(page).toHaveURL(/\?poste=porte-televiseur-1950$/);
  // Arrows move between the actions.
  await actions(page).getByRole("button", { name: "Revenir" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(actions(page).getByRole("button", { name: "Ouvrir la porte 1950" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(status(page)).toHaveText(/^Entrée — Televiseur 1950\./, { timeout: 8000 });
  await expect(page).toHaveURL(/\?salle=televiseur-1950$/);
  // Escape goes back : out through the door, into the corridor.
  await page.keyboard.press("Escape");
  await expect(status(page)).toHaveText("Porte 1950. 3 déplacements possibles.", { timeout: 8000 });
  expect(errors).toEqual([]);
});

test("parcours : le bouton Retour du navigateur remonte le chemin", async ({ page }) => {
  await open(page, "?poste=porte-minitel-1");
  await expect(status(page)).toHaveText("Porte 1982. 3 déplacements possibles.");
  await actions(page).getByRole("button", { name: "Ouvrir la porte 1982" }).click();
  await expect(page).toHaveURL(/\?salle=minitel-1$/, { timeout: 8000 });
  await actions(page).getByRole("button", { name: /Aller : Minitel 1/ }).click();
  await expect(page).toHaveURL(/\?salle=minitel-1&poste=terminal$/, { timeout: 6000 });
  await page.goBack();
  await expect(status(page)).toHaveText(/^Entrée — Minitel 1\./, { timeout: 6000 });
  await page.goBack();
  await expect(status(page)).toHaveText("Porte 1982. 3 déplacements possibles.", { timeout: 8000 });
  await expect(page).toHaveURL(/\?poste=porte-minitel-1$/);
});

test("parcours : arrivée directe, ancien lien ?modele=, clic sur une porte", async ({ page }) => {
  await open(page, "?modele=terminatel-255");
  await expect(status(page)).toHaveText(/^Terminatel 255\./);
  await open(page, "?poste=porte-terminatel-255");
  const before = await stagePixels(page, '[data-testid="monde"]');
  // The door faces the camera at its station : a click in the middle opens it.
  const box = (await page.getByTestId("monde").boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(actions(page)).toContainText("En déplacement", { timeout: 2000 });
  await page.waitForTimeout(1600);
  expect((await stagePixels(page, '[data-testid="monde"]')).hash).not.toBe(before.hash);
  await expect(page).toHaveURL(/\?salle=terminatel-255$/, { timeout: 8000 });
});

test("parcours : mouvement réduit, des fondus brefs ; pas de défilement horizontal", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "?poste=porte-televiseur-1950");
  await actions(page).getByRole("button", { name: "Ouvrir la porte 1950" }).click();
  // A 0.4 s fade instead of the 4.2 s sequence and passage.
  await expect(status(page)).toHaveText(/^Entrée — Televiseur 1950\./, { timeout: 1500 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  const sound = page.getByRole("button", { name: /Son/ });
  await expect(sound).toHaveAttribute("aria-pressed", "false");
});
