"use strict";

const winston = require('winston');

const appLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/app.log' })
    ]
});

module.exports = appLogger;