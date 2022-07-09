/* eslint-disable node/no-unpublished-import */
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import config from '../../src/config/config';

let replset: MongoMemoryReplSet;

/**
 * Connect to the in-memory database.
 */
const connect = async () => {
  replset = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
    binary: { version: config.mongoose.version },
  });

  await replset.waitUntilRunning();
  const uri = replset.getUri();
  config.mongoose.url = uri;
  await mongoose.connect(uri, config.mongoose.options as mongoose.ConnectOptions);
};

/**
 * Drop database, close the connection and stop mongod.
 */
const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await replset.stop();
};

/**
 * Remove all the data for all db collections.
 */
const clearDatabase = async () => {
  await Promise.all(
    Object.keys(mongoose.connection.collections).map(async (key) => {
      const collection = mongoose.connection.collections[key];
      await collection.deleteMany({});
    })
  );
};

export default { connect, closeDatabase, clearDatabase };
