import { plainToInstance } from 'class-transformer';
import { JobImp } from './jobs/job.definition';
import { WelcomeEmail, VehicleDataCollection } from './jobs';

export const JobDictionary = new Map([
  [WelcomeEmail.name, WelcomeEmail],
  [VehicleDataCollection.name, VehicleDataCollection],
]);

export const getJobInstance = (data: JobImp): JobImp => {
  const jobClass = JobDictionary.get(data.name);
  if (jobClass) {
    return plainToInstance(jobClass, data);
  }
  return {} as JobImp;
};
