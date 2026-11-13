import { Locator, Page, expect } from '@playwright/test';

// Shell shared by every section: sidebar menu, top bar title, toast, modal.
export class BasePage {
  readonly title: Locator;
  readonly toast: Locator;
  readonly modal: Locator;
  constructor(readonly page: Page) {
    this.title = page.locator('#title');
    this.toast = page.locator('#toast');
    this.modal = page.locator('.modal');
  }
  navLink(route: string) { return this.page.locator(`#nav > a[data-r="${route}"]`); }
  async openSection(route: string) {
    await this.navLink(route).click();
    await expect(this.page).toHaveURL(new RegExp(`#${route}`));
  }
  async goto(hash = 'home') {
    await this.page.goto('/#' + hash);
    await expect(this.title).not.toHaveText('MyDesk');   // the shell has booted and mounted a module
  }
}
