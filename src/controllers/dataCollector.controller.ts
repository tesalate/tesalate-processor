import Logger from '../config/logger';
import { dataCollectorService } from '../services';
import { Values as loopValues } from '../services/dataCollector.service';

const logger = Logger('dataCollector.controller');

const getLoop = async (vehicle: string) => {
  try {
    const loop = await dataCollectorService.getLoop(vehicle);
    return loop;
  } catch (error) {
    logger.error('error getting loop', error);
    return;
  }
};

const setLoop = async (vehicle: string, value: loopValues) => {
  try {
    await dataCollectorService.setLoop(vehicle, value);
  } catch (error) {
    logger.error('error setting loop', error);
    return;
  }
};

const setLoopExpiration = async (vehicle: string) => {
  try {
    await dataCollectorService.setLoopExpiration(vehicle);
  } catch (error) {
    logger.error('error setting loop cache expiration', error);
    return;
  }
};

export default {
  getLoop,
  setLoop,
  setLoopExpiration,
};
