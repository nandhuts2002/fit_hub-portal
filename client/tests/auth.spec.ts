import { test, expect } from '@playwright/test';

test.describe('🔐 Authentication Module', () => {
    test('Landing page loads with correct title', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/FitHub/i);
    });

    test('Landing page shows FITHUB branding', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const brand = page.locator('text=FITHUB').first();
        await expect(brand).toBeVisible({ timeout: 10000 });
    });

    test('Landing page shows Start Your Journey button', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const btn = page.locator('text=Start Your Journey').first();
        await expect(btn).toBeVisible({ timeout: 10000 });
    });

    test('Login page loads with Welcome Back heading', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        const heading = page.locator('h1:has-text("Welcome Back")');
        await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('Login page has email input field', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        const emailInput = page.locator('input[name="email"]');
        await expect(emailInput).toBeVisible({ timeout: 10000 });
    });

    test('Login page has password input field', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        const passwordInput = page.locator('input[name="password"]');
        await expect(passwordInput).toBeVisible({ timeout: 10000 });
    });

    test('Login page has Sign In button', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        const signInBtn = page.locator('button[type="submit"]:has-text("Sign In")');
        await expect(signInBtn).toBeVisible({ timeout: 10000 });
    });

    test('Login page has Forgot password link', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        const forgotLink = page.locator('a[href="/forgot-password"]');
        await expect(forgotLink).toBeVisible({ timeout: 10000 });
    });

    test('Login page has Sign up here link', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        const signupLink = page.locator('a[href*="/signup"]');
        await expect(signupLink).toBeVisible({ timeout: 10000 });
    });

    test('Login page has Google sign-in button', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        const googleBtn = page.locator('text=Continue with Google');
        await expect(googleBtn).toBeVisible({ timeout: 10000 });
    });

    test('Signup page loads with Join FITHUB heading', async ({ page }) => {
        await page.goto('/signup');
        await page.waitForLoadState('networkidle');
        const heading = page.locator('h1:has-text("FITHUB")');
        await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('Signup page has first name input', async ({ page }) => {
        await page.goto('/signup');
        await page.waitForLoadState('networkidle');
        const input = page.locator('input[name="firstName"]');
        await expect(input).toBeVisible({ timeout: 10000 });
    });

    test('Signup page has email input', async ({ page }) => {
        await page.goto('/signup');
        await page.waitForLoadState('networkidle');
        const input = page.locator('input[name="email"]');
        await expect(input).toBeVisible({ timeout: 10000 });
    });

    test('Signup page has User role selector', async ({ page }) => {
        await page.goto('/signup');
        await page.waitForLoadState('networkidle');
        const userRole = page.locator('button[role="tab"]:has-text("User")');
        await expect(userRole).toBeVisible({ timeout: 10000 });
    });

    test('Signup page has Trainer role selector', async ({ page }) => {
        await page.goto('/signup');
        await page.waitForLoadState('networkidle');
        const trainerRole = page.locator('button[role="tab"]:has-text("Trainer")');
        await expect(trainerRole).toBeVisible({ timeout: 10000 });
    });

    test('Forgot password page loads', async ({ page }) => {
        await page.goto('/forgot-password');
        await page.waitForLoadState('networkidle');
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible({ timeout: 10000 });
    });

    test('Navigate from login to signup', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        const signupLink = page.locator('a[href*="/signup"]');
        await signupLink.click();
        await expect(page).toHaveURL(/signup/);
    });

    test('Login page has Back to Home button', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        const backBtn = page.locator('text=Back to Home');
        await expect(backBtn).toBeVisible({ timeout: 10000 });
    });
});
