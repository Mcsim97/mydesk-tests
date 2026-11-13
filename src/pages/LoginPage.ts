import { Locator, Page, expect } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  constructor(readonly page: Page) {
    this.email = page.locator('#aEmail');
    this.password = page.locator('#aPass');
    this.submit = page.locator('#aGo');
    this.error = page.locator('#aErr');
  }
  async open() {
    await this.page.goto('/');
    await expect(this.email).toBeVisible();
  }
  async login(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
