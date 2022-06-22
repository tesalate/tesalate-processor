import mongoose, { MongooseOptions } from 'mongoose';
import config from './config';
import Logger from '../config/logger';

const logger = Logger('mongo');

const mongo = async () => {
  const { url, options } = config.mongoose;
  mongoose.connect(url, options as MongooseOptions);
  const connection = mongoose.connection;

  connection.on('connected', async () => {
    logger.info(`Connected to DB ${url}`);
  });

  connection.on('error', (err) => {
    logger.error('Mongoose default connection has encountered an error', err);
    process.exit(0);
  });

  connection.on('disconnected', () => {
    logger.error('Mongoose default connection is disconnected');
    if (config.env !== 'test') process.exit(0);
  });

  process.on('SIGINT', () => {
    connection.close(() => {
      logger.error('Mongoose default connection is disconnected due to application termination');
      process.exit(0);
    });
  });
  return connection;
};
export default mongo;
