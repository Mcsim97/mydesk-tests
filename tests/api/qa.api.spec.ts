import { test, expect } from '../../src/fixtures/test';
import { sampleRun } from '../../src/data/runs';

test.describe('«Качество»: приём результатов (/api/qa/ingest)', () => {
  test('без ключа → 401', async ({ api }) => {
    expect((await api.qaIngest(null, sampleRun())).status()).toBe(401);
  });

  test('чужой/выдуманный ключ → 403', async ({ api }) => {
    expect((await api.qaIngest('mdq_1_' + '0'.repeat(40), sampleRun())).status()).toBe(403);
    expect((await api.qaIngest('mdq_99999_' + 'a'.repeat(40), sampleRun())).status()).toBe(403);
  });

  test('верный ключ → прогон сохранён, статистика посчитана сервером @smoke', async ({ newUser }) => {
    const { key } = await (await newUser.api.qaCreateKey()).json();
    expect(key).toMatch(/^mdq_\d+_[0-9a-f]{40}$/);
    const r = await newUser.api.qaIngest(key, sampleRun({ passed: 5, failed: 2, flaky: 1, skipped: 1 }));
    expect(r.status()).toBe(200);
    expect((await r.json()).stats).toEqual({ total: 9, passed: 5, failed: 2, flaky: 1, skipped: 1 });
    const qa = await (await newUser.api.qa()).json();
    expect(qa.runs[0].status).toBe('failed');
    expect(qa).not.toHaveProperty('keyHash');   // the hash never leaves the server
    expect(qa.hasKey).toBe(true);
  });

  test('новый ключ отключает старый', async ({ newUser }) => {
    const { key: oldKey } = await (await newUser.api.qaCreateKey()).json();
    const { key: newKey } = await (await newUser.api.qaCreateKey()).json();
    expect((await newUser.api.qaIngest(oldKey, sampleRun())).status()).toBe(403);
    expect((await newUser.api.qaIngest(newKey, sampleRun())).status()).toBe(200);
  });

  test('повторная отправка с тем же id не дублирует прогон', async ({ newUser }) => {
    const { key } = await (await newUser.api.qaCreateKey()).json();
    const run = sampleRun({ id: 'same-id' });
    await newUser.api.qaIngest(key, run);
    await newUser.api.qaIngest(key, run);
    const qa = await (await newUser.api.qa()).json();
    expect(qa.runs.filter((r: { id: string }) => r.id === 'same-id')).toHaveLength(1);
  });
});
