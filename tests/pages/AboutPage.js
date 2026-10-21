import { BasePage } from './BasePage.js';

export class AboutPage extends BasePage {
  async goto() {
    await super.goto('/about');
  }

  get heading() {
    return this.page.getByRole('heading', { name: 'Greener living, made doable.' });
  }
}
