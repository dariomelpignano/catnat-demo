import { test, expect } from '@playwright/test';

test.describe('Catnat Demo E2E', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Demo Polizza Catnat');
  });

  test('should prefill form with valid P.IVA', async ({ page }) => {
    await page.goto('/');

    // Fill P.IVA input
    await page.fill('input#piva', '01234567890');

    // Click prefill button
    await page.click('button:has-text("Precompila")');

    // Wait for loading to complete
    await expect(page.locator('button:has-text("Caricamento...")')).toBeVisible();
    await expect(page.locator('button:has-text("Precompila")')).toBeVisible({ timeout: 10000 });

    // Check that company data is displayed
    await expect(page.locator('text=Dati Impresa')).toBeVisible();
    await expect(page.locator('text=Metallica SRL')).toBeVisible();

    // Check that map is displayed
    await expect(page.locator('text=Mappa ubicazione')).toBeVisible();

    // Check that massimali are displayed
    await expect(page.locator('text=Massimali suggeriti')).toBeVisible();
  });

  test('should show error for invalid P.IVA', async ({ page }) => {
    await page.goto('/');

    // Fill invalid P.IVA
    await page.fill('input#piva', '99999999999');

    // Click prefill button
    await page.click('button:has-text("Precompila")');

    // Wait for error message
    await expect(page.locator('text=P.IVA not found')).toBeVisible({ timeout: 5000 });
  });
});
