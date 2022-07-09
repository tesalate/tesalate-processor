import { mongoService } from './services';
import { queueController } from './controllers';
import { changeStreamService } from './services';
import { defaultNotification } from './queue/notification';
import { setupBullMQProcessor, defaultQueueName } from './queue/queue';
import config from './config/config';
import Logger from './config/logger';

const logger = Logger('index');
const { appType } = config;

const init = async () => {
  return await mongoService();
};

process.on('unhandledRejection', (err) => {
  logger.error('unhandledRejection', err);
  process.exit(1);
});

init().then(async () => {
  if (!appType || appType === 'producer') {
    logger.info('Producer starting');
    queueController.flushQueue();
    changeStreamService();
    defaultNotification(defaultQueueName);
    await queueController.seedQueue();
  }

  if (!appType || appType === 'consumer') {
    logger.info('Consumer starting');
    await setupBullMQProcessor();
  }
});
