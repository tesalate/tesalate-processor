import { IVehicle } from '../models/vehicle.model';
import { VehicleDataCollection } from '../queue/jobs';
import { defaultQueue, defaultRepeatJobOpts } from '../queue/queue';

const getJobsFromQueue = async () => {
  return await defaultQueue.getRepeatableJobs();
};

const addVehicleToQueue = async (id: string) => {
  await defaultQueue.add(id, new VehicleDataCollection({ vehicle: id }), {
    ...defaultRepeatJobOpts,
    jobId: id,
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
  removeVehicleFromQueue,
  removeVehicleFromQueueByVehicleId,
  getJobsFromQueue,
  seedQueue,
  flushQueue,
};
