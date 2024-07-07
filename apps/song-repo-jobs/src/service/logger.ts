import moment from 'moment';
import { createLogger, transports, format } from 'winston';

const customFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`)
);

export const date = moment().format('YYYY-MM-DD');
export const logger = createLogger({
    level: 'debug',
    format: format.simple(),
    transports: [
        new transports.File({
            filename: `${date}.log`,
            format: customFormat,
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
