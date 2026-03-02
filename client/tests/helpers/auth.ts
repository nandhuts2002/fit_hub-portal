import { Page } from '@playwright/test';

/**
 * Inject authentication state into localStorage for testing.
 * 
 * SessionManager stores session in 'fitness_app_session' key and validates:
 * - token (required)
 * - name (required)
 * - email (required)
 * - role (used for routing)
 * - timestamp (checked for 24h expiry)
 *
 * ProtectedRoute also checks 'medical_ack_v2' for user role.
 */
export async function loginAsUser(page: Page): Promise<void> {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
        // Set the session in the exact format SessionManager expects
        const sessionData = {
            token: 'test-jwt-token-user-123',
            name: 'Test User',
            email: 'testuser@fithub.com',
            role: 'user',
            timestamp: Date.now(),
        };
        localStorage.setItem('fitness_app_session', JSON.stringify(sessionData));

        // Set medical acknowledgement so ProtectedRoute doesn't redirect
        const medicalAck = {
            accepted: true,
            ts: Date.now(),
        };
        localStorage.setItem('medical_ack_v2', JSON.stringify(medicalAck));
    });
}

export async function loginAsTrainer(page: Page): Promise<void> {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
        const sessionData = {
            token: 'test-jwt-token-trainer-123',
            name: 'Test Trainer',
            email: 'testtrainer@fithub.com',
            role: 'trainer',
            timestamp: Date.now(),
        };
        localStorage.setItem('fitness_app_session', JSON.stringify(sessionData));
    });
}

export async function loginAsAdmin(page: Page): Promise<void> {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
        const sessionData = {
            token: 'test-jwt-token-admin-123',
            name: 'Test Admin',
            email: 'testadmin@fithub.com',
            role: 'admin',
            timestamp: Date.now(),
        };
        localStorage.setItem('fitness_app_session', JSON.stringify(sessionData));
    });
}

export async function logout(page: Page): Promise<void> {
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
}
