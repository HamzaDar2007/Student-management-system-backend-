import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, context, trace } = info as {
      timestamp?: string;
      level: string;
      message: unknown;
      context?: string;
      trace?: string;
    };
    const ctx = context ? `[${context}]` : '';
    const traceStr = trace ? `\n${trace}` : '';
    return `${timestamp ?? ''} ${level} ${ctx} ${String(message)}${traceStr}`;
  }),
);

// Custom format for file output (JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Daily rotate transport for error logs
const errorRotateTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  format: fileFormat,
});

// Daily rotate transport for combined logs
const combinedRotateTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
});

// Console transport
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
});

export const winstonConfig: WinstonModuleOptions = {
  level: logLevel,
  transports: [
    consoleTransport,
    ...(isProduction ? [errorRotateTransport, combinedRotateTransport] : []),
  ],
  // Handle uncaught exceptions
  exceptionHandlers: isProduction
    ? [
        new DailyRotateFile({
          filename: 'logs/exceptions-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: fileFormat,
        }),
      ]
    : [],
  // Handle unhandled promise rejections
  rejectionHandlers: isProduction
    ? [
        new DailyRotateFile({
          filename: 'logs/rejections-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: fileFormat,
        }),
      ]
    : [],
};

export default winstonConfig;
