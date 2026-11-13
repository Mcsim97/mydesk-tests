// Builder of fake test runs for the «Качество» API/UI tests
type Counts = { passed?: number; failed?: number; flaky?: number; skipped?: number; id?: string };

export function sampleRun({ passed = 3, failed = 0, flaky = 0, skipped = 0, id }: Counts = {}) {
  const tests: object[] = [];
  const add = (n: number, status: string) => {
    for (let i = 0; i < n; i++) tests.push({
      id: `${status}-${i}`, title: `${status} test ${i}`, file: 'tests/demo.spec.ts', project: 'api', status, duration: 100 + i * 10,
      retries: status === 'flaky' ? 1 : 0, error: status === 'failed' ? 'Error: expected 200, received 500' : undefined,
    });
  };
  add(passed, 'passed'); add(failed, 'failed'); add(flaky, 'flaky'); add(skipped, 'skipped');
  return { id: id ?? `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, startedAt: new Date().toISOString(), duration: 1234, env: 'test', branch: 'main', tests };
}
