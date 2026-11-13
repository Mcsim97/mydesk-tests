import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { User } from '../data/users';

// Thin client over MyDesk's REST API. Every APIRequestContext keeps its own cookies → one context = one signed-in device.
export class MyDeskApi {
  constructor(readonly request: APIRequestContext) {}

  health() { return this.request.get('/api/health'); }
  register(u: Partial<User> & { invite?: string }) { return this.request.post('/api/auth/register', { data: u }); }
  login(u: Pick<User, 'email' | 'password'>, deviceName = 'playwright') { return this.request.post('/api/auth/login', { data: { ...u, deviceName } }); }
  logout() { return this.request.post('/api/auth/logout', { data: {} }); }
  me() { return this.request.get('/api/me'); }
  devices() { return this.request.get('/api/devices'); }
  createInvite() { return this.request.post('/api/invites', { data: {} }); }

  getStore(name: string) { return this.request.get(`/api/store/${name}`); }
  putStore(name: string, doc: unknown) { return this.request.put(`/api/store/${name}`, { data: doc }); }

  qa() { return this.request.get('/api/qa'); }
  qaCreateKey() { return this.request.post('/api/qa/key', { data: {} }); }
  qaIngest(key: string | null, run: unknown) {
    return this.request.post('/api/qa/ingest', { data: run, headers: key ? { Authorization: `Bearer ${key}` } : {} });
  }

  /** register-or-login helper that fails the test with a readable message */
  async signIn(u: Pick<User, 'email' | 'password'>) {
    const r = await this.login(u);
    await expectOk(r, `login ${u.email}`);
    return r.json();
  }
}

export async function expectOk(r: APIResponse, what = 'request') {
  expect(r.ok(), `${what}: HTTP ${r.status()} ${await r.text().catch(() => '')}`).toBeTruthy();
}
