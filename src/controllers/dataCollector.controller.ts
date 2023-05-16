import Logger from '../config/logger';
import { dataCollectorService } from '../services';
import { loops, LoopType } from '../services/dataCollector.service';

const logger = Logger('dataCollector.controller');

const getLoop = async (vehicle: string): Promise<LoopType> => {
  try {
    const loop = await dataCollectorService.getLoop(vehicle);
    return loop;
  } catch (error) {
    logger.error('error getting loop', error);
    return loops.outer;
  }
};

const setLoop = async (vehicle: string, loopType: LoopType) => {
  try {
    await dataCollectorService.setLoop(vehicle, loopType);
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
