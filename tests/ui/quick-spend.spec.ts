import { test, expect } from '../../src/fixtures/test';
import { HomePage } from '../../src/pages/HomePage';
import { SpendModal } from '../../src/pages/SpendModal';

// UI action → check the result through the API (the classic UI + API combination)
test('быстрый расход с Главной сохраняется в Финансах', async ({ userPage, newUser }) => {
  const home = new HomePage(userPage), spend = new SpendModal(userPage);
  const name = 'Сільпо autotest ' + Date.now();
  await home.open();
  await home.quickSpend.click();
  await spend.fill({ amount: 345.5, name, category: 'food' });
  await spend.save.click();
  await expect(spend.root).toBeHidden();

  // the app saves with a short debounce → poll the API until the expense appears
  await expect.poll(async () => JSON.stringify(await (await newUser.api.getStore('finance')).json()), { timeout: 10_000 }).toContain(name);
  const fin = await (await newUser.api.getStore('finance')).json();
  const exp = fin.months.flatMap((m: { extra?: object[] }) => m.extra || []).find((x: { name: string }) => x.name === name);
  expect(exp).toMatchObject({ amount: 345.5, currency: 'UAH', cat: 'food' });
});

test('расход без суммы не сохраняется', async ({ userPage }) => {
  const home = new HomePage(userPage), spend = new SpendModal(userPage);
  await home.open();
  await home.quickSpend.click();
  await spend.fill({ amount: 0, name: 'пусто' });
  await spend.amount.fill('');
  await spend.save.click();
  await expect(spend.root).toBeVisible();
  await expect(spend.amount).toBeFocused();
});
