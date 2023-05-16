import { IVehicle } from '../models/vehicle.model';
import { defaultQueue, defaultRepeatJobOpts } from '../queue/queue';
import { VehicleDataCollection /*, VehicleDataEmail */ } from '../queue/jobs';

const getJobsFromQueue = async () => {
  return await defaultQueue.getRepeatableJobs();
};

const addVehicleToQueue = async (id: string) => {
  await defaultQueue.add(id, new VehicleDataCollection({ vehicle: id }), {
    ...defaultRepeatJobOpts,
    jobId: id,
  });
  // await defaultQueue.add(id, new VehicleDataEmail({ vehicle: id }), {
  //   ...defaultRepeatJobOpts,
  //   repeat: {
  //     pattern: '0 19 * * SUN',
  //   },
  //   jobId: `${id}-email`,
  // });
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
