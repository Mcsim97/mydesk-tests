// Test users. The admin is created once per run by tests/setup/auth.setup.ts (first account on an empty DB = admin).
// Other users get unique emails so parallel tests never collide.
export const ADMIN = { email: 'admin@mydesk.test', password: 'Admin-pass-123', name: 'Admin' } as const;

let n = 0;
export const uniqueUser = (prefix = 'user') => ({
  email: `${prefix}-${Date.now().toString(36)}-${process.pid}-${++n}@mydesk.test`,
  password: 'User-pass-123',
  name: `${prefix} ${n}`,
});
export type User = ReturnType<typeof uniqueUser>;

// modules switched on for UI tests (so the first-run onboarding dialog does not appear)
export const PREFS = { version: 1, modules: ['power', 'finance', 'work', 'dev'], profile: 'qa' };
