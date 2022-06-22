const redis = require('redis');

describe('test redis connection', () => {
  it('should do add key to redis', (done) => {
    const redisClient = redis.createClient();
    redisClient.set('key', 'myKeyValue', () => {
      redisClient.get('key', (_err: unknown, redisValue: string): void => {
        expect(redisValue).toBe('myKeyValue');
        done();
      });
    });
  });
});
