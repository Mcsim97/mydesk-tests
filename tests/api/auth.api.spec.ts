import { test, expect, ADMIN } from '../../src/fixtures/test';
import { uniqueUser } from '../../src/data/users';

test.describe('Авторизация (API)', () => {
  for (const path of ['/api/me', '/api/store/finance', '/api/devices', '/api/qa', '/api/jobs']) {
    test(`401 без сессии: ${path} @smoke`, async ({ request }) => {
      const r = await request.get(path);
      expect(r.status()).toBe(401);
      expect((await r.json()).error).toBeTruthy();
    });
  }

  test('неверный пароль → 401 и понятная ошибка', async ({ api }) => {
    const r = await api.login({ email: ADMIN.email, password: 'wrong-password' });
    expect(r.status()).toBe(401);
    expect((await r.json()).error).toMatch(/Неверный email или пароль/);
  });

  test.describe('валидация регистрации', () => {
    const cases = [
      { name: 'email без @', data: { email: 'not-an-email', password: 'long-enough-1' }, status: 400, error: /email/i },
      { name: 'короткий пароль', data: { email: 'short@mydesk.test', password: '1234567' }, status: 400, error: /минимум 8/ },
      { name: 'без инвайта', data: { email: 'noinvite@mydesk.test', password: 'long-enough-1' }, status: 403, error: /инвайт/ },
    ];
    for (const c of cases) test(c.name, async ({ api }) => {
      const r = await api.register(c.data);
      expect(r.status()).toBe(c.status);
      expect((await r.json()).error).toMatch(c.error);
    });
  });

  test('инвайт одноразовый: повторная регистрация по нему → 403', async ({ adminApi, api }) => {
    const { code } = await (await adminApi.createInvite()).json();
    expect((await api.register({ ...uniqueUser(), invite: code })).status()).toBe(200);
    expect((await api.register({ ...uniqueUser(), invite: code })).status()).toBe(403);
  });

  test('лимит 5 устройств: шестой вход → 409 со списком устройств', async ({ newUser, playwright, baseURL }) => {
    // registration already signed in device #1; four more logins from separate contexts = 5 devices
    for (let i = 2; i <= 5; i++) {
      const ctx = await playwright.request.newContext({ baseURL });
      expect((await ctx.post('/api/auth/login', { data: { email: newUser.email, password: newUser.password, deviceName: 'device ' + i } })).status()).toBe(200);
      await ctx.dispose();
    }
    const sixth = await playwright.request.newContext({ baseURL });
    const r = await sixth.post('/api/auth/login', { data: { email: newUser.email, password: newUser.password } });
    expect(r.status()).toBe(409);
    const body = await r.json();
    expect(body.max).toBe(5);
    expect(body.devices).toHaveLength(5);
    await sixth.dispose();
  });

  test('выход отзывает сессию', async ({ newUser }) => {
    expect((await newUser.api.me()).status()).toBe(200);
    expect((await newUser.api.logout()).status()).toBe(200);
    expect((await newUser.api.me()).status()).toBe(401);
  });
});
