import { test, expect } from '../../src/fixtures/test';

test.describe('Сервер', () => {
  test('health-check отвечает ok @smoke', async ({ api }) => {
    const r = await api.health();
    expect(r.status()).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
  });

  test('отдаёт приложение и манифест офлайн-кэша', async ({ request }) => {
    const index = await request.get('/');
    expect(index.status()).toBe(200);
    expect(index.headers()['content-type']).toContain('text/html');
    const files: string[] = await (await request.get('/sw-manifest.json')).json();
    expect(files).toEqual(expect.arrayContaining(['/index.html', '/js/app.js', '/css/app.css']));
    expect(files).not.toContain('/sw.js');
  });

  test('не выпускает за пределы папки public (path traversal)', async ({ request }) => {
    const r = await request.get('/..%2f..%2fpackage.json');
    expect(r.status()).toBe(404);
  });
});
