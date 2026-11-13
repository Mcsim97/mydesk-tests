import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import { execSync } from 'child_process';
import path from 'path';

// Custom Playwright reporter: sends a summary of the run to MyDesk → «Качество» (POST /api/qa/ingest).
// Active only when MYDESK_URL and MYDESK_QA_KEY are set (the key comes from Качество → Подключение and lives in .env / CI secrets).
const map = (o: ReturnType<TestCase['outcome']>, r?: TestResult) =>
  o === 'flaky' ? 'flaky' : o === 'skipped' ? 'skipped' : o === 'expected' ? 'passed' : r?.status === 'timedOut' ? 'timedOut' : r?.status === 'interrupted' ? 'interrupted' : 'failed';
const strip = (s = '') => s.replace(/\u001b\[[0-9;]*m/g, '');
const git = (cmd: string) => { try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };

export default class MyDeskReporter implements Reporter {
  private started = new Date();
  private rootDir = process.cwd();
  private tests = new Map<string, TestCase>();

  onBegin(config: FullConfig, _suite: Suite) { this.started = new Date(); this.rootDir = config.rootDir; }
  onTestEnd(test: TestCase) { this.tests.set(test.id, test); }

  async onEnd(result: FullResult) {
    const url = process.env.MYDESK_URL, key = process.env.MYDESK_QA_KEY;
    if (!url || !key) return;
    const tests = [...this.tests.values()].map(t => {
      const last = t.results[t.results.length - 1];
      const project = t.parent.project()?.name || '';
      return {
        id: `${project}::${path.relative(this.rootDir, t.location.file).split(path.sep).join('/')}::${t.titlePath().slice(3).join(' › ')}`,
        title: t.title, file: path.relative(this.rootDir, t.location.file).split(path.sep).join('/'), suite: t.parent.title, project, tags: t.tags,
        status: map(t.outcome(), last), duration: t.results.reduce((s, r) => s + r.duration, 0), retries: Math.max(0, t.results.length - 1),
        error: last?.error ? strip(last.error.message || last.error.value || '').slice(0, 1500) : undefined,
      };
    });
    const gh = process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : '';
    const body = {
      id: process.env.GITHUB_RUN_ID ? `gh-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT || 1}` : `local-${this.started.getTime()}`,
      name: 'mydesk-tests', startedAt: this.started.toISOString(), duration: Math.round(result.duration), status: result.status,
      env: process.env.CI ? 'ci' : 'local', branch: process.env.GITHUB_REF_NAME || git('git rev-parse --abbrev-ref HEAD'),
      commit: process.env.GITHUB_SHA || git('git rev-parse HEAD'), ciUrl: gh, tests,
    };
    try {
      const r = await fetch(url.replace(/\/$/, '') + '/api/qa/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
      const j: any = await r.json().catch(() => ({}));
      console.log(r.ok ? `\n[MyDesk] результаты отправлены в «Качество»: ${j.stats?.passed}/${j.stats?.total} прошло` : `\n[MyDesk] не отправлено: HTTP ${r.status} ${j.error || ''}`);
    } catch (e: any) { console.log(`\n[MyDesk] не отправлено: ${e.message}`); }
  }
  printsToStdio() { return false; }
}
