import { BaseJob, JobImp } from '../../src/queue/jobs/job.definition';

describe('builds a new job class based off the base job class', () => {
  class TestJob extends BaseJob implements JobImp {
    constructor(public payload: Record<string, unknown>) {
      super();
    }
    handle = (): void => {};
    failed = (): void => {};
  }

  const payload = { test: 'data' };
  const job = new TestJob(payload);

  it('truthy', () => {
    expect(typeof job.handle).toBe('function');
    expect(typeof job.failed).toBe('function');
    expect(typeof job.name).toBe('string');
    expect(job.name).toBe('TestJob');
    expect(job.payload).toBe(payload);
  });
});
