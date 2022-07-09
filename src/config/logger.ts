import winston from 'winston';
import stringify from 'json-stringify-safe';

import config from './config';
import isEmpty from 'lodash/isEmpty';

const { printf, metadata, combine, json } = winston.format;

const color = {
  info: '\x1b[32m',
  error: '\x1b[31m',
  warn: '\x1b[33m',
  debug: '\x1b[34m',
};
type T1 = keyof typeof color;

const Logger = (module: string) => {
  return winston.createLogger({
    level: config.logLevel,
    transports: [
      new winston.transports.Console({
        level: config.logLevel,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        format: printf((info: any): string => {
          const { level, message, ...rest } = info;
          let formattedMessage = `[${new Date().toISOString()}] ${
            color[level as T1] || ''
          }[${level.toUpperCase()}] [${module.toUpperCase()}] - ${message}`;
          if (!isEmpty(rest)) formattedMessage += ` | ${stringify(rest)}`;
          formattedMessage += '\x1b[0m ';
          return formattedMessage;
        }),
      }),
      new winston.transports.File({
        filename: './logs/error.log',
        level: 'error',
        format: combine(metadata(), json()),
      }),
    ],
  });
};

export default Logger;
