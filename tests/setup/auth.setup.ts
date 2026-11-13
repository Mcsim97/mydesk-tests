import { test as setup, expect } from '@playwright/test';
import { MyDeskApi, expectOk } from '../../src/api/MyDeskApi';
import { ADMIN, PREFS } from '../../src/data/users';

// Runs once before the api/ui projects: the very first account on the empty test DB becomes the admin.
// Its cookie is saved to .auth/admin.json → UI tests start already signed in (one device instead of one per test).
setup('create the admin account and save the session', async ({ request }) => {
  const api = new MyDeskApi(request);
  const st = await (await request.get('/api/auth/needs-invite')).json();
  expect(st.firstUser, 'the test server must start with an empty database').toBe(true);
  await expectOk(await api.register(ADMIN), 'register admin');
  const me = await (await api.me()).json();
  expect(me.is_admin).toBe(true);
  await expectOk(await api.putStore('prefs', PREFS), 'switch modules on');
  await request.storageState({ path: '.auth/admin.json' });
});
