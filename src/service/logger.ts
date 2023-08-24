import { createLogger, transports, format } from 'winston';

const custom = format.combine(
    format.timestamp(),
    format.printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`)
);

export const logger = createLogger({
    level: 'debug',
    format: format.simple(),
    transports: [
        new transports.File({
            filename: 'result.log',
            format: custom,
            options: { flags: 'w' }
        })
    ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.simple(),
    }));
}
