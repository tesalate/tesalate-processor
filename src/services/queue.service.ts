import { IVehicle } from '../models/vehicle.model';
import { ITeslaAccount } from '../models/teslaAccount.model';
import { defaultQueue, defaultRepeatJobOpts } from '../queue/queue';
import { VehicleDataCollection, DataCollectionStoppedEmail } from '../queue/jobs';

const getJobsFromQueue = async () => {
  return await defaultQueue.getRepeatableJobs();
};

const addVehicleToQueue = async (id: string) => {
  await defaultQueue.add(id, new VehicleDataCollection({ vehicle: id }), {
    ...defaultRepeatJobOpts,
    jobId: id,
  });
};

const addEmailToQueue = async (teslaAccount: ITeslaAccount) => {
  await defaultQueue.add(`${teslaAccount._id}:email`, new DataCollectionStoppedEmail(teslaAccount), {
    jobId: `${teslaAccount._id}:email`,
    removeOnComplete: true,
    removeOnFail: true,
    priority: 1,
  });
};

const removeVehicleFromQueue = async (key: string) => {
  await defaultQueue.removeRepeatableByKey(key);
};

const removeVehicleFromQueueByVehicleId = async (id: string) => {
  const found = (await getJobsFromQueue()).find((job) => job.id === id);
  if (found) await removeVehicleFromQueue(found.key);
};

const seedQueue = async (vehicles: IVehicle[]) => {
  for (const vehicle of vehicles) {
    const id = vehicle._id;
    await addVehicleToQueue(id);
  }
};

const flushQueue = async (jobs: string[]) => {
  for (const job of jobs) {
    await removeVehicleFromQueue(job);
  }
};

export default {
  addVehicleToQueue,
  addEmailToQueue,
  removeVehicleFromQueue,
  removeVehicleFromQueueByVehicleId,
  getJobsFromQueue,
  seedQueue,
  flushQueue,
};
