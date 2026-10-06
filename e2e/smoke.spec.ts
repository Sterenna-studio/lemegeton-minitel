import { expect, test } from '@playwright/test';

test('loads the Minitel and navigates with the keyboard', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByTestId('screen-text')).toContainText('3615 LEMEGETON');
  await page.keyboard.press('2');
  await expect(page.getByTestId('screen-text')).toContainText('ARCHIVES');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('screen-text')).toContainText('LE TERMINAL DES POSSIBLES');
  expect(errors).toEqual([]);
});
