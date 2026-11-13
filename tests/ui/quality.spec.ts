import { test, expect } from '../../src/fixtures/test';
import { QualityPage } from '../../src/pages/QualityPage';
import { sampleRun } from '../../src/data/runs';

test.describe('Раздел «Качество»', () => {
  test('без прогонов — подсказка, как подключить тесты', async ({ userPage }) => {
    const qa = new QualityPage(userPage);
    await qa.open();
    await expect(qa.empty).toBeVisible();
    await expect(qa.empty).toContainText('Здесь появятся твои автотесты');
  });

  test('ключ создаётся и показывается один раз', async ({ userPage }) => {
    const qa = new QualityPage(userPage);
    await qa.open('setup');
    await qa.createKey.click();
    await expect(qa.newKey).toHaveText(/^mdq_\d+_[0-9a-f]{40}$/);
    const hint = (await qa.newKey.textContent())!.slice(-4);
    await userPage.reload();
    await expect(userPage.locator('#qKeyBox')).toContainText('Ключ создан: mdq_…' + hint, { timeout: 15_000 });
    await expect(qa.newKey).toHaveCount(0);
  });

  test('отправленный прогон появляется на дашборде', async ({ userPage, newUser }) => {
    const { key } = await (await newUser.api.qaCreateKey()).json();
    await newUser.api.qaIngest(key, sampleRun({ passed: 9, failed: 1 }));
    const qa = new QualityPage(userPage);
    await qa.open();
    await expect(qa.kpis).toHaveCount(4);
    await expect(qa.kpis.first()).toContainText('90%');
    await expect(qa.kpis.first()).toContainText('Есть падения');
    await expect(qa.kpis.nth(1)).toContainText('10');
    await expect(userPage.locator('#b-qa')).toHaveText('1');   // red badge in the menu = failed tests of the last run
  });
});
