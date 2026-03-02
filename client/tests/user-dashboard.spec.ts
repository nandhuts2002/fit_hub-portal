import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('🏠 User Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsUser(page);
    });

    test('Dashboard loads after authentication', async ({ page }) => {
        await page.goto('/user-home');
        await page.waitForLoadState('networkidle');
        // Page should not redirect to login since we injected auth
        await expect(page).not.toHaveURL(/login/);
    });

    test('Dashboard shows main content area', async ({ page }) => {
        await page.goto('/user-home');
        await page.waitForLoadState('networkidle');
        const body = page.locator('body');
        await expect(body).toBeVisible();
        // Should have some visible content, not an empty div
        const root = page.locator('#root');
        await expect(root).not.toBeEmpty();
    });

    test('Dashboard URL is correct', async ({ page }) => {
        await page.goto('/user-home');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/user-home/);
    });
});
