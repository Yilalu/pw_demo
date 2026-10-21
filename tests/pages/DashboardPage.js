import { BasePage } from './BasePage.js';

export class DashboardPage extends BasePage {
  async goto() {
    await super.goto('/dashboard');
  }

  get heading() {
    return this.page.getByRole('heading', { name: /^Good to have you,/ });
  }

  get activityInput() {
    return this.page.getByRole('textbox', { name: 'Add a good habit' });
  }

  get addActivityButton() {
    return this.page.getByRole('button', { name: 'Add habit' });
  }

  get editProfileButton() {
    return this.page.getByRole('button', { name: 'Edit profile' });
  }

  get profileNameInput() {
    return this.page.getByRole('textbox', { name: 'Name' });
  }

  get profileLocationInput() {
    return this.page.getByRole('textbox', { name: /Location/ });
  }

  get saveProfileButton() {
    return this.page.getByRole('button', { name: 'Save changes' });
  }
}
