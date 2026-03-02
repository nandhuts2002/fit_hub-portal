import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('👥 Community Module', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsUser(page);
    });

    test('Community page loads at correct URL', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/community/);
    });

    test('Community page renders content', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');
        const root = page.locator('#root');
        await expect(root).not.toBeEmpty();
    });

    test('Community page does not redirect to login', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');
        await expect(page).not.toHaveURL(/login/);
    });
});
