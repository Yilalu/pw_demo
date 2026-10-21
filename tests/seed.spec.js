import { test, expect } from './fixtures/index.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';

test('signs in with a registered account and opens the dashboard', async ({ page, testUser }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(testUser.email, testUser.password);

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(new DashboardPage(page).heading).toBeVisible();
});
