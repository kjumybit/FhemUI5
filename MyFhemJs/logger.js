/**
 * hints: 
 * - the folder structure of a file logger must exists 
 * - provide a logrotate configuration file
 * 
 */
"use strict";

const winston = require('winston');

const appLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: '/var/log/fhemjs.log' })
        // new winston.transports.Console({ format: winston.format.simple() })
    ]
});

module.exports = appLogger;