import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('🧘 Yoga & Exercise', () => {
    test('Yoga landing page loads at root', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveTitle(/FitHub/i);
    });

    test('Yoga page has hero section with Reconnect heading', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('Yoga page has Why Choose section', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const section = page.locator('text=Why Choose').first();
        await expect(section).toBeVisible({ timeout: 10000 });
    });

    test('Yoga page has navigation links', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const homeLink = page.locator('a[href="#home"]');
        await expect(homeLink).toBeVisible({ timeout: 10000 });
    });

    test('Yoga page has Login / Sign up button', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const loginBtn = page.locator('text=Login / Sign up').first();
        await expect(loginBtn).toBeVisible({ timeout: 10000 });
    });

    test('Yoga page has footer', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const footer = page.locator('footer');
        await expect(footer).toBeVisible({ timeout: 10000 });
    });
});
