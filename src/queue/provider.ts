import { plainToInstance } from 'class-transformer';
import { JobImp } from './jobs/job.definition';
import { VehicleDataCollection } from './jobs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const JobDictionary = new Map<string, any>([[VehicleDataCollection.name, VehicleDataCollection]]);

export const getJobInstance = (data: JobImp): JobImp => {
  const jobClass = JobDictionary.get(data.name);
  if (jobClass) {
    return plainToInstance(jobClass, data);
  }
  return {} as JobImp;
};
