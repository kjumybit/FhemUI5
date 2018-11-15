/**
 * hint: the folder structure of a file logger must exists 
 */
"use strict";

const winston = require('winston');

const appLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: './logs/app.log' })
        // new winston.transports.Console({ format: winston.format.simple() })
    ]
});

module.exports = appLogger;