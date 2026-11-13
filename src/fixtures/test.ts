import { test as base, expect, request as pwRequest, Page } from '@playwright/test';
import { MyDeskApi, expectOk } from '../api/MyDeskApi';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { QualityPage } from '../pages/QualityPage';
import { SpendModal } from '../pages/SpendModal';
import { ADMIN, PREFS, uniqueUser, User } from '../data/users';

type Fixtures = {
  api: MyDeskApi;            // anonymous API client (no session)
  adminApi: MyDeskApi;       // signed in as the admin (re-uses the device saved by the setup project)
  newUser: User & { api: MyDeskApi };   // a brand-new invited user, already signed in through the API, modules switched on
  userPage: Page;           // a browser tab signed in as `newUser` (separate from the admin's storageState)
  loginPage: LoginPage;
  homePage: HomePage;
  qualityPage: QualityPage;
  spendModal: SpendModal;
};

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => use(new MyDeskApi(request)),
  adminApi: async ({ baseURL }, use) => {
    const ctx = await pwRequest.newContext({ baseURL, storageState: '.auth/admin.json' });
    await use(new MyDeskApi(ctx));
    await ctx.dispose();
  },
  newUser: async ({ baseURL, adminApi }, use) => {
    const inv = await adminApi.createInvite(); await expectOk(inv, 'create invite');
    const { code } = await inv.json();
    const u = uniqueUser();
    const ctx = await pwRequest.newContext({ baseURL });
    const api = new MyDeskApi(ctx);
    await expectOk(await api.register({ ...u, invite: code }), 'register invited user');
    await expectOk(await api.putStore('prefs', PREFS), 'prefs');
    await use({ ...u, api });
    await ctx.dispose();
  },
  userPage: async ({ browser, newUser, baseURL }, use) => {
    const ctx = await browser.newContext({ baseURL, storageState: await newUser.api.request.storageState(), viewport: { width: 1400, height: 950 }, locale: 'ru-RU' });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  homePage: async ({ page }, use) => use(new HomePage(page)),
  qualityPage: async ({ page }, use) => use(new QualityPage(page)),
  spendModal: async ({ page }, use) => use(new SpendModal(page)),
});
export { expect, ADMIN };
