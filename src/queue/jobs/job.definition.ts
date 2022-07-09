import { Job } from 'bullmq';

export interface JobImp {
  name: string;
  payload?: Record<string, unknown> | unknown;
  handle: (job: Job) => Promise<void> | void;
  failed: (job: Job) => void;
}

export class BaseJob {
  readonly name: string = this.constructor.name;
}
