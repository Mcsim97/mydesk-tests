import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

// «Качество» — dashboard of autotest runs
export class QualityPage extends BasePage {
  readonly empty: Locator;
  readonly kpis: Locator;
  readonly createKey: Locator;
  readonly newKey: Locator;
  constructor(page: Page) {
    super(page);
    this.empty = page.locator('.qa-empty');
    this.kpis = page.locator('.qa-kpis .kpi');
    this.createKey = page.locator('#qKey');
    this.newKey = page.locator('#qKeyV');
  }
  tab(name: 'overview' | 'runs' | 'tests' | 'setup') { return this.page.locator(`#nav .subnav a[href="#qa/${name}"]`); }
  async open(tab = 'overview') { await this.goto('qa/' + tab); await expect(this.title).toHaveText('Качество'); }
}
