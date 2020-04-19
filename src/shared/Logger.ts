import winston from "winston";

export class Logger {
	private static singleton: winston.Logger;
	public static getInstance(): winston.Logger {
		if (!Logger.singleton) {
			Logger.singleton = Logger.createLogger();
		}

		return Logger.singleton;
	}

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
				new winston.transports.File({ filename: 'combined.log', level: 'debug' })
			]
		});
	}
}