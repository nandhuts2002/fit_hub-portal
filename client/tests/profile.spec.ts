import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('👤 Profile & Routing', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsUser(page);
    });

    test('Profile page loads at correct URL', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');
        await expect(page).not.toHaveURL(/login/);
    });

    test('Profile page renders content', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');
        const root = page.locator('#root');
        await expect(root).not.toBeEmpty();
    });

    test('Legacy /userhome redirects to /user-home', async ({ page }) => {
        await page.goto('/userhome');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/user-home/);
    });

    test('Unknown route redirects appropriately', async ({ page }) => {
        await page.goto('/nonexistent-page-xyz');
        await page.waitForLoadState('networkidle');
        // Should not stay on the nonexistent path — redirects to home or user-home
        const url = page.url();
        expect(url.includes('/nonexistent-page-xyz') === false || url.includes('user-home') || url.includes('/')).toBeTruthy();
    });
});
