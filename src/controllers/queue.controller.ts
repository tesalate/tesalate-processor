import { vehicleService, queueService } from '../services';

import Logger from '../config/logger';

const logger = Logger('queue.controller');

const seedQueue = async () => {
  try {
    const jobs = (await queueService.getJobsFromQueue()).map((job) => job.id);

    const vehicles = await vehicleService.getVehicles({ collectData: true, _id: { $nin: jobs } });
    await queueService.seedQueue(vehicles);

    if (vehicles?.length > 0)
      logger.info(
        'queue has been seeded with the following vehicle ids',
        vehicles.map((vehicle) => vehicle._id)
      );
  } catch (error) {
    logger.error('error seeding queue', error);
  }
};

const flushQueue = async () => {
  try {
    const jobs = await queueService.getJobsFromQueue();

    const vehiclesToDequeue = await vehicleService.getVehicles({
      collectData: false,
      _id: { $in: jobs.map((job) => job.id) },
    });

    const jobIds = vehiclesToDequeue
      .map((vehicle) => jobs.find((job) => job.id === vehicle._id)?.key)
      .filter((e) => e === undefined);

    await queueService.flushQueue(jobIds as string[]);

    if (vehiclesToDequeue?.length > 0) logger.info('flushing the following vehicles from the queue', jobIds);
  } catch (error) {
    logger.error('error flushing queue', error);
  }
};

export default {
  seedQueue,
  flushQueue,
};
