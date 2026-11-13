import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly greeting: Locator;
  readonly quickSpend: Locator;
  readonly quickTask: Locator;
  readonly stats: Locator;
  constructor(page: Page) {
    super(page);
    this.greeting = page.locator('.hello');
    this.quickSpend = page.locator('#qSpend');
    this.quickTask = page.locator('#qTask');
    this.stats = page.locator('#stats');
  }
  widget(id: string) { return this.stats.locator(`.wgt[data-id="${id}"]`); }
  async open() { await this.goto('home'); await expect(this.greeting).toBeVisible(); }
}
