import { test, expect, type Page } from "@playwright/test";

// Languages of the site (src/i18n, docs/TRADUCTION.md) : English by the
// address or by the browser, and the switch of the headers.

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

test("langues : version anglaise par l'adresse, puis retour au français", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/?lang=en&modele=minitel-1");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("button", { name: "3D+ mode" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Front view" })).toBeVisible();
  await expect(page.locator(".credits")).toContainText("Model:");
  // The switch names the other language, in that language.
  await page.getByRole("button", { name: "Version française" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("button", { name: "Mode 3D+" })).toBeVisible();
  await expect(page).toHaveURL(/lang=fr/);
  expect(errors).toEqual([]);
});

test.describe("navigateur en anglais", () => {
  test.use({ locale: "en-US" });

  test("langues : le mode 3D+ et la documentation suivent la langue du navigateur", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/?mode=3d");
    await expect(page.getByTestId("annonce")).toHaveText("Corridor entrance. 1 possible move.", { timeout: 30000 });
    await expect(page.getByRole("button", { name: "Go: 1950 door" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Simple mode" })).toBeVisible();
    await page.goto("/documentation/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terminal documentation");
    await expect(page.getByRole("heading", { level: 2, name: "1950 Television", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /lemegeton-core/ })).toHaveAttribute("href", "https://github.com/Sterenna-studio/lemegeton-core");
    expect(errors).toEqual([]);
  });
});
