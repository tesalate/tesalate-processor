import mongoose from 'mongoose';
import Logger from '../config/logger';
import Vehicle from '../models/vehicle.model';
import queueService from './queue.service';
const logger = Logger('changeStream.service');

const changeStream = () => {
  const connection = mongoose.connection;
  connection.once('open', () => {
    logger.info('Change stream connected');
    const changeStream = Vehicle.watch([], { fullDocument: 'updateLookup' });
    changeStream.on('error', (err) => {
      logger.warn(err.message, err);
      return;
    });
    changeStream.on('change', async (change) => {
      switch (change.operationType) {
        case 'insert': {
          const { fullDocument } = change;
          const { _id, collectData } = fullDocument;
          if ('collectData' in fullDocument && collectData) {
            const id = _id.toHexString();
            await queueService.addVehicleToQueue(id);
          }
          break;
        }

        case 'update': {
          const { fullDocument = {}, updateDescription = {} } = change;
          const { _id, collectData } = fullDocument;
          const { updatedFields = {} } = updateDescription;
          const id = _id.toHexString();

          if ('collectData' in updatedFields) {
            const found = (await queueService.getJobsFromQueue()).find((job) => job.id === id);
            if (!found && collectData) {
              queueService.addVehicleToQueue(id);
              logger.info('added job to queue', { id });
            } else if (found && !collectData) {
              await queueService.removeVehicleFromQueue(found.key);
              logger.info('removed job from queue', { key: found.key });
            }
          }
          break;
        }

        case 'delete': {
          const { documentKey } = change;
          const id = documentKey._id.toHexString();
          const found = (await queueService.getJobsFromQueue()).find((job) => job.id === id);
          if (!found) {
            logger.info('No jobs with that id', { id });
            break;
          }
          await queueService.removeVehicleFromQueue(found.key);
          logger.info('removed job from queue', { key: found.key });
          break;
        }

        default: {
          logger.info('change not handled', change);
          break;
        }
      }
    });
  });
};
export default changeStream;
