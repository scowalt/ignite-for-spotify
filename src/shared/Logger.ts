import winston from "winston";

export class Logger {
	public static getInstance(): winston.Logger {
		if (!Logger.singleton) {
			Logger.singleton = Logger.createLogger();
		}

		return Logger.singleton;
	}
	private static singleton: winston.Logger;

	private static createLogger(): winston.Logger {
		return winston.createLogger({
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.prettyPrint()
			),
			transports: [
				new winston.transports.Console({
					format: winston.format.simple(),
					level: 'warn'
				}),
				new winston.transports.File({ filename: 'werror.log', level: 'warn' }),
				new winston.transports.File({ filename: 'info.log', level: 'info' }),
				new winston.transports.File({ filename: 'debug.log', level: 'debug', maxsize: 20 * 1024 * 1024, maxFiles: 10 })
			]
		});
	}
}
