import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { createTestUser } from '../utils/test-users.js';

export { expect };

export const test = base.extend({
  testUser: async ({ request }, use) => {
    const user = createTestUser();
    const response = await request.post('/api/auth/register', { data: user });
    const responseBody = await response.text();
    expect(
      response.status(),
      `synthetic account setup should succeed; API returned ${response.status()}: ${responseBody}`,
    ).toBe(201);
    await use(user);
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await page.waitForURL('**/dashboard');
    await use(page);
  },
});
