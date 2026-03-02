import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('🛒 Shop Module', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsUser(page);
    });

    test('Shop page loads at correct URL', async ({ page }) => {
        await page.goto('/shop');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/shop/);
    });

    test('Shop page does not redirect to login', async ({ page }) => {
        await page.goto('/shop');
        await page.waitForLoadState('networkidle');
        await expect(page).not.toHaveURL(/login/);
    });

    test('Shop page renders content', async ({ page }) => {
        await page.goto('/shop');
        await page.waitForLoadState('networkidle');
        const root = page.locator('#root');
        await expect(root).not.toBeEmpty();
    });
});
