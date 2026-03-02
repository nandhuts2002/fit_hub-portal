import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('🎟️ My Tickets', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsUser(page);
    });

    test('My Tickets page loads at correct URL', async ({ page }) => {
        await page.goto('/my-tickets');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/my-tickets/);
    });

    test('My Tickets page does not redirect to login', async ({ page }) => {
        await page.goto('/my-tickets');
        await page.waitForLoadState('networkidle');
        await expect(page).not.toHaveURL(/login/);
    });

    test('My Tickets page renders content', async ({ page }) => {
        await page.goto('/my-tickets');
        await page.waitForLoadState('networkidle');
        const root = page.locator('#root');
        await expect(root).not.toBeEmpty();
    });
});
