/* eslint-disable node/no-unpublished-import */
import Redis from 'ioredis';
import { EJSON } from 'bson';
import { Charger } from '../../src/models';
import connection from '../../src/config/redis';
import { chargerController } from '../../src/controllers';
import setupTestDB from '../utils/setupTestDB';
import chargers from '../fixtures/charger.json';
import { ICharger } from '../../src/models/charger.model';
setupTestDB();

describe('charger integration test', () => {
  let client: Redis;
  let chargerArr: ICharger[];
  beforeAll(async () => {
    client = connection;
    chargerArr = (EJSON.deserialize(chargers) as ICharger[]) || ([] as ICharger[]);
    await Charger.insertMany(chargerArr);
  });
  afterEach(() => {
    jest.resetAllMocks();
    client.flushall();
  });
  afterAll(() => {
    client.quit();
  });

  it('should get a charger from the db', async () => {
    const chargerObj = chargerArr[0];
    await chargerController.getCharger(chargerObj!._id);
  });
});
