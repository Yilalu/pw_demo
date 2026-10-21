import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  async goto() {
    await super.goto('/login');
  }

  async login(email, password) {
    await this.page.getByLabel('Email address').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }

  get heading() {
    return this.page.getByRole('heading', { name: 'Good to see you.' });
  }

  get alert() {
    return this.page.getByRole('alert');
  }
}
