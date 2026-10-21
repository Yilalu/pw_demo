import { BasePage } from './BasePage.js';

export class RegisterPage extends BasePage {
  async goto() {
    await super.goto('/register');
  }

  async register({ name, email, password }) {
    await this.page.getByLabel('Your name').fill(name);
    await this.page.getByLabel('Email address').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Create my account' }).click();
  }

  get heading() {
    return this.page.getByRole('heading', { name: 'Join the journey.' });
  }
}
