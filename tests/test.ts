import { VehicleDataCollection } from '../src/queue/jobs';

describe('test vehicle data job', () => {
  const payload = { test: 'value' };
  const job = new VehicleDataCollection(payload);
  it('truthy', () => {
    expect(typeof job.handle).toBe('function');
    expect(typeof job.failed).toBe('function');
    expect(typeof job.name).toBe('string');
    expect(typeof job.payload).toBe('object');
    expect(job.payload).toBe(payload);
  });
});
