import { BasePage } from './BasePage.js';

export class HomePage extends BasePage {
  async goto() {
    await super.goto('/');
  }

  get heading() {
    return this.page.getByRole('heading', { name: 'Live a little greener.' });
  }

  get exploreTipsLink() {
    return this.page.getByRole('link', { name: 'Explore eco tips' });
  }
}
