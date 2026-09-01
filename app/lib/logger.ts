import pino from 'pino';

/**
 * High-performance structured logger for Indian Railways AI Block Planner.
 * Logs structured JSON events in production and formatted output in development.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: 'ir-ai-block-planner',
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
