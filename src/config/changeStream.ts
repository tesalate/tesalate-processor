import mongoose from 'mongoose';
import Logger from './logger';
const logger = Logger('change-stream');

const changeStream = (connection: mongoose.Connection) => {
  connection.once('open', () => {
    const changeStream = connection.watch(undefined, { fullDocument: 'updateLookup' });
    changeStream.on('error', (err) => logger.error(err.message, err));
    changeStream.on('change', async (change) => {
      switch (change.operationType) {
        case 'insert': {
          break;
        }

        case 'update': {
          break;
        }

        case 'delete': {
          break;
        }

        default: {
          logger.info('default case hit', change);
          break;
        }
      }
    });
  });
};
export default changeStream;
