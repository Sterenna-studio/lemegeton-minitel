import { test, expect, type Page } from "@playwright/test";
import sharp from "sharp";
import { stagePixels } from "./helpers";

// The explorable world on its rails (lot D) : /parcours/.

async function open(page: Page, query = "") {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`/parcours/${query}`);
  // The models of the place are loaded (the room cards and the credits light
  // up the stage before the 3D does).
  await expect(page.locator(".world-loading")).toHaveCount(0, { timeout: 30000 });
  await expect.poll(async () => (await stagePixels(page, '[data-testid="monde"]')).lit, { timeout: 30000 }).toBeGreaterThan(5000);
  return errors;
}
// The world's announcement (the terminal has its own status region).
const status = (page: Page) => page.getByTestId("annonce");
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
  // A 0.4 s fade instead of the 4.2 s sequence and passage (the room still
  // loads its terminal : allow for it).
  await expect(status(page)).toHaveText(/^Entrée — Televiseur 1950\./, { timeout: 4000 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  const sound = page.getByRole("button", { name: /Son/ });
  await expect(sound).toHaveAttribute("aria-pressed", "false");
});

test("salle : devant le terminal, le 3615 et les réglages comme dans la version simple", async ({ page }) => {
  const errors = await open(page, "?salle=terminatel-255&poste=terminal");
  await expect(status(page)).toHaveText(/^Terminatel 255\./);
  const console3615 = page.locator(".world-terminal .console");
  await expect(console3615).toBeVisible();
  await console3615.getByRole("button", { name: /Archives/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "ARCHIVES" })).toBeAttached();
  // Settings : furniture under the desk terminal.
  await console3615.getByRole("button", { name: "Reglages CRT" }).click();
  await page.getByLabel("Mobilier").selectOption("table-basse");
  await expect(page).toHaveURL(/table=table-basse/);
  // Leave the terminal : back to the entry of the room, the console goes.
  await actions(page).getByRole("button", { name: /Aller : Entrée/ }).click();
  await expect(status(page)).toHaveText(/^Entrée — Terminatel 255\./, { timeout: 6000 });
  await expect(console3615).toHaveCount(0);
  expect(errors).toEqual([]);
});

// Share of lit pixels above the 3615 console : the room itself.
async function roomLit(page: Page) {
  const box = (await page.getByTestId("monde").boundingBox())!;
  const shot = await page.screenshot({ clip: { x: box.x, y: box.y, width: box.width, height: box.height * 0.5 } });
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  let lit = 0;
  for (let i = 0; i < data.length; i += info.channels) if (data[i] + data[i + 1] + data[i + 2] > 60) lit++;
  return lit / (info.width * info.height);
}
const cost = async (page: Page) => {
  const canvas = page.locator('[data-testid="monde"] canvas');
  return { calls: Number(await canvas.getAttribute("data-calls")), triangles: Number(await canvas.getAttribute("data-triangles")) };
};

for (const [room, label] of [
  ["televiseur-1950", "Televiseur 1950"],
  ["minitel-1", "Minitel 1"],
  ["terminatel-255", "Terminatel 255"],
]) {
  test(`salle ${room} : décor rendu dès l'arrivée, budget d'une salle`, async ({ page }) => {
    for (const poste of ["entree", "terminal"]) {
      const errors = await open(page, `?salle=${room}${poste === "terminal" ? "&poste=terminal" : ""}`);
      const place = poste === "terminal" ? label : `Entrée — ${label}`;
      await expect(status(page)).toHaveText(new RegExp(`^${place}\\.`));
      // Rendered on demand : the room shows without moving the pointer (a view
      // left black reads 0 ; the marble room is dark by design).
      await expect.poll(() => roomLit(page), { timeout: 20000 }).toBeGreaterThan(0.08);
      // Budget of docs/MONDE_EXPLORABLE.md §8 : a whole room <= 150 calls, 300 k triangles.
      await expect.poll(async () => (await cost(page)).calls, { timeout: 10000 }).toBeGreaterThan(0);
      const { calls, triangles } = await cost(page);
      expect(calls).toBeLessThanOrEqual(150);
      expect(triangles).toBeLessThanOrEqual(300000);
      expect(errors).toEqual([]);
    }
  });
}
