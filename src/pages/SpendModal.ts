import { Locator, Page, expect } from '@playwright/test';

// «+ Расход» dialog (Finance quick expense)
export class SpendModal {
  readonly root: Locator;
  readonly amount: Locator;
  readonly currency: Locator;
  readonly name: Locator;
  readonly date: Locator;
  readonly save: Locator;
  readonly cancel: Locator;
  constructor(readonly page: Page) {
    this.root = page.locator('.modal').filter({ has: page.locator('#xa') });
    this.amount = this.root.locator('#xa');
    this.currency = this.root.locator('#xc');
    this.name = this.root.locator('#xn');
    this.date = this.root.locator('#xd');
    this.save = this.root.locator('[data-ok]');
    this.cancel = this.root.locator('[data-x]');
  }
  category(key: string) { return this.root.locator(`#xk button[data-k="${key}"]`); }
  async fill({ amount, name, category, date }: { amount: number; name: string; category?: string; date?: string }) {
    await expect(this.root).toBeVisible();
    await this.amount.fill(String(amount));
    if (category) await this.category(category).click();
    await this.name.fill(name);
    if (date) await this.date.fill(date);
  }
}
