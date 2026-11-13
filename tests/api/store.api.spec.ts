import { test, expect } from '../../src/fixtures/test';

test.describe('Документы пользователя (/api/store)', () => {
  test('PUT → GET возвращает тот же документ @smoke', async ({ newUser }) => {
    const doc = { version: 1, projects: [{ id: 'p1', name: 'Autotests', color: '#34d399' }], tasks: [{ id: 't1', title: 'Написать API-тест', status: 'todo', projectId: 'p1' }], log: [] };
    const put = await newUser.api.putStore('work', doc);
    expect(put.status()).toBe(200);
    expect((await put.json()).ok).toBe(true);
    expect(await (await newUser.api.getStore('work')).json()).toEqual(doc);
  });

  test('неизвестный документ → 404', async ({ newUser }) => {
    const r = await newUser.api.getStore('passwords');
    expect(r.status()).toBe(404);
  });

  test('данные одного пользователя не видны другому', async ({ newUser, adminApi }) => {
    const secret = { version: 1, projects: [], tasks: [{ id: 'x', title: 'секрет ' + newUser.email, status: 'todo' }], log: [] };
    await newUser.api.putStore('work', secret);
    const admins = await (await adminApi.getStore('work')).json();
    expect(JSON.stringify(admins ?? {})).not.toContain(newUser.email);
  });

  test('битый JSON → 400', async ({ newUser }) => {
    // Buffer = raw bytes; a plain string would be JSON-encoded by Playwright into a valid JSON string
    const r = await newUser.api.request.put('/api/store/work', { data: Buffer.from('{oops'), headers: { 'Content-Type': 'application/json' } });
    expect(r.status()).toBe(400);
  });

  // BUG found by this suite (2026-11-13): the server saved any JSON (a string, a number, an array) as the whole document
  // and the section broke for the user. Fixed in MyDesk server.js — this is the regression test.
  for (const [what, doc] of [['строка', 'oops'], ['число', 42], ['массив', [1, 2]], ['null', null]] as const) {
    test(`документ — ${what}, а не объект → 400, старые данные целы`, async ({ newUser }) => {
      const good = { version: 1, projects: [], tasks: [], log: [] };
      await newUser.api.putStore('work', good);
      const r = await newUser.api.request.put('/api/store/work', { data: Buffer.from(JSON.stringify(doc)), headers: { 'Content-Type': 'application/json' } });
      expect(r.status()).toBe(400);
      expect(await (await newUser.api.getStore('work')).json()).toEqual(good);
    });
  }
});
