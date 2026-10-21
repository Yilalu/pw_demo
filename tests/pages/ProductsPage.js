import { BasePage } from './BasePage.js';

export class ProductsPage extends BasePage {
  async goto() {
    await super.goto('/products');
  }

  get heading() {
    return this.page.getByRole('heading', { name: 'Good things, made better.' });
  }

  get searchBox() {
    return this.page.getByRole('textbox', { name: 'Search products' });
  }

  get productArticles() {
    return this.page.getByRole('article');
  }

  get addFavoriteButton() {
    return this.page.getByRole('button', { name: /^Add .* to favorites$/ }).first();
  }

  get removeFavoriteButton() {
    return this.page.getByRole('button', { name: /^Remove .* from favorites$/ }).first();
  }
}
