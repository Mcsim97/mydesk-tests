import { test, expect } from '../../src/fixtures/test';
import { BasePage } from '../../src/pages/BasePage';

// signed in as the admin (storageState from the setup project)
const SECTIONS = [
  { route: 'home', title: 'Главная' },
  { route: 'power', title: 'Электричество' },
  { route: 'finance', title: 'Финансы' },
  { route: 'work', title: 'Работа' },
  { route: 'dev', title: 'Развитие' },
  { route: 'english', title: 'Английский' },
  { route: 'career', title: 'Карьера' },
  { route: 'qa', title: 'Качество' },
  { route: 'settings', title: 'Настройки' },
];

test.describe('Навигация по меню', () => {
  for (const s of SECTIONS) {
    test(`раздел «${s.title}» открывается без ошибок`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', e => errors.push(e.message));
      const app = new BasePage(page);
      await app.goto('home');
      await app.openSection(s.route);
      await expect(app.title).toHaveText(s.title);
      await expect(page.locator('#view .card.err')).toHaveCount(0);   // «Ошибка модуля» card
      expect(errors, 'JS errors on the page').toEqual([]);
    });
  }

  test('у разделов с вкладками появляется подменю', async ({ page }) => {
    const app = new BasePage(page);
    await app.goto('qa');
    await expect(page.locator('#nav .subnav a')).toHaveText(['Обзор', 'Прогоны', 'Тесты', 'Подключение']);
  });
});
