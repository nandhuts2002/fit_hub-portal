import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('⚙️ Services Module', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsUser(page);
    });

    test('Medical check page loads (public route)', async ({ page }) => {
        await page.goto('/services/medical-check');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/medical-check/);
    });

    test('BMI Calculator page loads', async ({ page }) => {
        await page.goto('/services/bmi');
        await page.waitForLoadState('networkidle');
        await expect(page).not.toHaveURL(/login/);
    });

    test('BMI page has number inputs for height/weight', async ({ page }) => {
        await page.goto('/services/bmi');
        await page.waitForLoadState('networkidle');
        const inputs = page.locator('input[type="number"]');
        await expect(inputs.first()).toBeVisible({ timeout: 10000 });
    });

    test('AI Coach page loads', async ({ page }) => {
        await page.goto('/services/ai-coach');
        await page.waitForLoadState('networkidle');
        await expect(page).not.toHaveURL(/login/);
    });

    test('Body Part Selection page loads', async ({ page }) => {
        await page.goto('/services/body-parts');
        await page.waitForLoadState('networkidle');
        await expect(page).not.toHaveURL(/login/);
    });
});
