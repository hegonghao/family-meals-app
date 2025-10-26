import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { WinstonModuleOptions } from 'nest-winston';
import { format, transports } from 'winston';

export const buildLoggerOptions = (env?: string): WinstonModuleOptions => {
  const isProd = env === 'production';
  const logsDir = join(process.cwd(), 'logs');

  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }

  const consoleFormat = isProd
    ? format.json()
    : format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ level, message, timestamp, context, stack, ...meta }) => {
          const contextPart = context ? `[${context}] ` : '';
          const metaPart = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          const stackPart = stack ? `\n${stack}` : '';
          return `${timestamp as string} ${level}: ${contextPart}${message as string}${metaPart}${stackPart}`;
        }),
      );

  return {
    level: isProd ? 'info' : 'debug',
    defaultMeta: { service: 'family-meals-api' },
    transports: [
      new transports.Console({
        format: consoleFormat,
      }),
      new transports.File({
        filename: join(logsDir, 'error.log'),
        level: 'error',
        format: format.combine(format.timestamp(), format.json()),
      }),
    ],
  };
};
