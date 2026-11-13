import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import 'dotenv/config';

// Every run starts its own MyDesk server from the source folder with an EMPTY temporary database and backup folder,
// so tests never touch real data. The first registered user becomes the admin (see tests/setup/auth.setup.ts).
const APP_DIR = path.resolve(process.env.MYDESK_APP_DIR || '../MyDesk');
const PORT = Number(process.env.MYDESK_TEST_PORT || 5199);
export const BASE_URL = `http://127.0.0.1:${PORT}`;
const tmp = process.env.MYDESK_TMP || (process.env.MYDESK_TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mydesk-tests-')));   // same dir for the main process and workers

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results', detail: false }],
    ['./reporters/mydesk-reporter.ts'],
  ],
  use: {
    baseURL: BASE_URL,
    locale: 'ru-RU',
    timezoneId: 'Europe/Kyiv',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    reducedMotion: 'reduce',   // 3D scene renders one still frame instead of an animation loop → faster, stable screenshots
  },
  projects: [
    { name: 'setup', testMatch: /setup\/.*\.setup\.ts/ },
    { name: 'api', testMatch: /api\/.*\.spec\.ts/, dependencies: ['setup'] },
    { name: 'ui', testMatch: /ui\/.*\.spec\.ts/, dependencies: ['setup'], use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 950 }, storageState: '.auth/admin.json' } },
  ],
  webServer: {
    command: 'node server.js',
    cwd: APP_DIR,
    url: BASE_URL + '/api/health',
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: { PORT: String(PORT), HOST: '127.0.0.1', PGLITE_DIR: path.join(tmp, 'pg'), BACKUP_DIR: path.join(tmp, 'backups'), PUPPETEER_SKIP_DOWNLOAD: '1', NODE_ENV: 'test' },
  },
});
