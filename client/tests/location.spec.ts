import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('📍 Location Features', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsUser(page);
    });

    test('Location page loads at correct URL', async ({ page }) => {
        await page.goto('/location');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/location/);
    });

    test('Location page does not redirect to login', async ({ page }) => {
        await page.goto('/location');
        await page.waitForLoadState('networkidle');
        await expect(page).not.toHaveURL(/login/);
    });

    test('Location page renders content', async ({ page }) => {
        await page.goto('/location');
        await page.waitForLoadState('networkidle');
        const root = page.locator('#root');
        await expect(root).not.toBeEmpty();
    });
});
