// eslint-disable-next-line node/no-unpublished-require
const Redis = require('ioredis-mock');
console.log('!!!!!!!!!', process.env.REDIS_VERSION);
class RedisMock {
  static Command = { _transformer: { argument: {}, reply: {} } };
  static _transformer = { argument: {}, reply: {} };

  constructor(...args) {
    Object.assign(RedisMock, Redis);
    const instance = new Redis(args);
    instance.options = {};
    // semver in redis client connection requires minimum version 5.0.0
    // https://github.com/taskforcesh/bullmq/blob/da8cdb42827c22fea12b9c2f4c0c80fbad786b98/src/classes/redis-connection.ts#L9
    instance.info = async () => `redis_version:${process.env.REDIS_VERSION || '5.0.0'}`;
    instance.connect = () => {};
    instance.disconnect = () => {};
    instance.duplicate = () => instance;

    return instance;
  }
}

module.exports = RedisMock;
