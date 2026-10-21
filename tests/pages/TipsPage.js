import { BasePage } from './BasePage.js';

export class TipsPage extends BasePage {
  async goto() {
    await super.goto('/tips');
  }

  get heading() {
    return this.page.getByRole('heading', { name: 'Good ideas grow here.' });
  }

  get searchBox() {
    return this.page.getByRole('textbox', { name: 'Search tips' });
  }

  get tipArticles() {
    return this.page.getByRole('article');
  }

  get saveTipButton() {
    return this.page.getByRole('button', { name: 'Save this tip' }).first();
  }

  get savedTipButton() {
    return this.page.getByRole('button', { name: 'Saved to my tips' }).first();
  }
}
