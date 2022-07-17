import os from 'os';
import Joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

const envVarsSchema = Joi.object()
  .keys({
    APP_TYPE: Joi.string().valid('consumer', 'producer', null).default(null),
    LOG_LEVEL: Joi.string().default('info'),
    PUBLIC_URL: Joi.string().required(),
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    MONGODB_VERSION: Joi.string().default('5.0.6'),
    REDIS_DB: Joi.number().default(0),
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_USER: Joi.string().default('default').description('User for Redis'),
    CACHE_TTL: Joi.number().default(30).description('How long data should be cached for in seconds'),
    REDIS_PASSWORD: Joi.string().default('').description('Password for Redis'),
    REPEAT_JOB_INTERVAL: Joi.number()
      .integer()
      .min(0)
      .max(10)
      .default(10)
      .description('How often a job should repeat in seconds. value <= 10'),
    DEFAULT_QUEUE_NAME: Joi.string().default('Vehicles'),
    CONCURRENT_WORKERS: Joi.number().default(os.cpus().length || 1),
    TESLA_OAUTH_V3_URL: Joi.string().description('tesla oauth v3 api url').default('https://auth.tesla.com/oauth2/v3'),
    TESLA_OWNER_API_URL: Joi.string().description('tesla owner api url').default('https://owner-api.teslamotors.com'),
    TESLA_OWNERAPI_CLIENT_ID: Joi.string().required(),
    TESLA_OWNERAPI_CLIENT_SECRET: Joi.string().required(),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  appType: envVars.APP_TYPE,
  logLevel: envVars.LOG_LEVEL,
  env: envVars.NODE_ENV,
  apiUrl: envVars.PUBLIC_URL,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '_test' : ''),
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
    version: envVars.MONGODB_VERSION,
  },
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    user: envVars.REDIS_USER,
    password: envVars.REDIS_PASSWORD ?? null,
  },
  cache: {
    ttl: envVars.CACHE_TTL,
  },
  tesla: {
    oauthUrl: envVars.TESLA_OAUTH_V3_URL,
    ownerUrl: envVars.TESLA_OWNER_API_URL,
    clientId: envVars.TESLA_OWNERAPI_CLIENT_ID,
    clientSecret: envVars.TESLA_OWNERAPI_CLIENT_SECRET,
  },
  queue: {
    workers: envVars.CONCURRENT_WORKERS,
    defaultQueueName: envVars.DEFAULT_QUEUE_NAME,
    jobInterval: envVars.REPEAT_JOB_INTERVAL,
  },
};
