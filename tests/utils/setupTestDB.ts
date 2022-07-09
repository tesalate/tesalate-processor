import dbHandler from './dbHandler';

const setupTestDB = () => {
  jest.setTimeout(120000);
  beforeAll(async () => {
    await dbHandler.connect();
  });
  beforeEach(async () => {
    await dbHandler.clearDatabase();
  });
  afterEach(async () => {
    await dbHandler.clearDatabase();
  });
  afterAll(async () => {
    await dbHandler.closeDatabase();
  });
};

export default setupTestDB;
