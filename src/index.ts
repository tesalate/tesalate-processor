import mongoose from 'mongoose';

import mongo from './config/mongo';
import { defaultQueue, setupBullMQProcessor } from './queue/queue';
import { VehicleDataCollection } from './queue/jobs';
import Logger from './config/logger';
import changeStream from './config/changeStream';

const logger = Logger('index');

export const init = async function (): Promise<void> {
  const connection = await mongo();
  changeStream(connection);

  const Schema = mongoose.Schema;

  const VehicleSchema = new Schema({}, { strict: false });
  const Vehicles = await mongoose.model('Vehicle', VehicleSchema, 'vehicles').find({});

  Vehicles.forEach((vehicle) => {
    const { _id, ...rest } = vehicle.toObject();
    defaultQueue.add(
      _id.toHexString(),
      new VehicleDataCollection({
        ...rest,
      }),
      {
        repeat: {
          every: 10 * 1000,
        },
        jobId: _id.toHexString(),
        removeOnComplete: true,
      }
    );
  });
};

process.on('unhandledRejection', (err) => {
  logger.error('unhandledRejection', err);
  process.exit(1);
});

init().then(() => {
  setupBullMQProcessor();
});
