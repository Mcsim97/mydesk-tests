import { test, expect } from '../../src/fixtures/test';
import { HomePage } from '../../src/pages/HomePage';

// these tests start signed out (override the admin storageState of the ui project)
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Вход', () => {
  test('пользователь входит и видит Главную @smoke', async ({ page, loginPage, newUser }) => {
    await loginPage.open();
    await loginPage.login(newUser.email, newUser.password);
    const home = new HomePage(page);
    await expect(home.greeting).toBeVisible();
    await expect(home.title).toHaveText('Главная');
  });

  test('неверный пароль — ошибка, остаёмся на экране входа', async ({ page, loginPage, newUser }) => {
    await loginPage.open();
    await loginPage.login(newUser.email, 'wrong-password');
    await expect(loginPage.error).toContainText('Неверный email или пароль');
    await expect(loginPage.email).toBeVisible();
    await expect(page.locator('.hello')).toHaveCount(0);
  });

  test('без входа защищённый раздел не открывается', async ({ page, loginPage }) => {
    await page.goto('/#finance');
    await expect(loginPage.email).toBeVisible();
  });
});
