// eslint-disable-next-line node/no-extraneous-import
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  restoreMocks: true,
  verbose: true,
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
export default config;
